import os

from dotenv import load_dotenv
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.adapters.schemas.tools_schema import ToolsSchema
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.processors.frame_processor import FrameDirection
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams

try:
    from .library import Library
    from .processors.frames import (
        BookSelectedFrame,
        EndSessionFrame,
        StartReadingFrame,
    )
    from .processors.state_manager import BookReadingStateManager
    from .prompt import FLOW_A_SYSTEM, FLOW_B_SYSTEM
except ImportError:
    from library import Library  # type: ignore[assignment]
    from processors.frames import (  # type: ignore[assignment]
        BookSelectedFrame,
        EndSessionFrame,
        StartReadingFrame,
    )
    from processors.state_manager import BookReadingStateManager  # type: ignore[assignment]
    from prompt import FLOW_A_SYSTEM, FLOW_B_SYSTEM  # type: ignore[assignment]

load_dotenv(override=True)


def _build_tools(has_book: bool) -> ToolsSchema:
    tools = [
        FunctionSchema(
            name="select_book",
            description="Select and load a book by its numeric index.",
            properties={
                "book_id": {
                    "type": "string",
                    "description": "The numeric index of the book (e.g. '1') as shown in the book list.",
                },
            },
            required=["book_id"],
        ),
        FunctionSchema(
            name="start_reading",
            description="Start or resume reading the selected book aloud. If chunk_id is omitted, resumes from the current position.",
            properties={
                "book_id": {
                    "type": "string",
                    "description": "The numeric index of the book (e.g. '1').",
                },
                "chunk_id": {
                    "type": "integer",
                    "description": "The chunk index to start reading from (0-based). Omit to resume from current position.",
                },
            },
            required=["book_id"],
        ),
        FunctionSchema(
            name="end_session",
            description="End the reading session and disconnect. Only call AFTER the child has confirmed they want to leave.",
            properties={},
            required=[],
        ),
    ]

    if not has_book:
        tools.insert(
            0,
            FunctionSchema(
                name="list_books",
                description="Fetch the list of available books for this child. Call this first when no book is pre-selected.",
                properties={},
                required=[],
            ),
        )

    return ToolsSchema(standard_tools=tools)


async def run_bot(
    transport: BaseTransport,
    runner_args: RunnerArguments,
    book_id: str | None = None,
    kid_id: str | None = None,
):
    """Pipeline: input -> STT -> user_agg -> LLM -> StateManager -> assistant_agg -> TTS -> output."""
    logger.info(f"run_bot started with transport={type(transport).__name__}")

    kid_id = kid_id or "demo_kid"

    stt = DeepgramSTTService(
        api_key=os.environ["DEEPGRAM_API_KEY"],
    )

    tts = CartesiaTTSService(
        api_key=os.environ["CARTESIA_API_KEY"],
        voice_id="4f7f1324-1853-48a6-b294-4e78e8036a83",
        model="sonic-2",
    )

    llm = OpenAILLMService(
        api_key=os.environ["OPENAI_API_KEY"],
        model="gpt-4",
    )

    # -- Build system prompt at context creation (never empty) --
    if book_id:
        system_prompt = FLOW_A_SYSTEM
    else:
        system_prompt = FLOW_B_SYSTEM

    tools = _build_tools(has_book=bool(book_id))
    context = LLMContext(
        messages=[{"role": "system", "content": system_prompt}],
        tools=tools,
    )

    agg_pair = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.2)),
        ),
    )
    user_agg = agg_pair.user()
    assistant_agg = agg_pair.assistant()

    library = Library(kid_id=kid_id)
    state_manager = BookReadingStateManager(library=library, context=context)

    # Pre-populate index map if book_id was provided
    if book_id:
        state_manager.populate_index("1", book_id)

    # -- Register function call handlers on the LLM --

    async def handle_list_books(params):
        books_with_progress = library.get_books_with_progress()
        if not books_with_progress:
            await params.result_callback("No books available for this child.")
            return

        lines = []
        for i, b in enumerate(books_with_progress, 1):
            idx = str(i)
            state_manager.populate_index(idx, b["id"])
            line = f'{idx}. "{b["title"]}"'
            if "current_chunk_index" in b:
                line += (
                    f' (in progress — chapter: "{b.get("chapter_title", "unknown")}"'
                    f', last passage: "{b.get("chunk_text", "")[:80]}...")'
                )
            else:
                line += " (new)"
            lines.append(line)

        await params.result_callback("Available books:\n" + "\n".join(lines))

    async def handle_select_book(params):
        raw_id = params.arguments["book_id"]
        resolved_id = state_manager.resolve_book_id(raw_id)
        book = library.initialize_book(resolved_id)
        if book:
            # Register index if not already mapped
            if raw_id not in state_manager._book_index_map:
                state_manager.populate_index(raw_id, resolved_id)

            progress = library.current_chunk_index
            if progress > 0:
                chunk = library.current_chunk()
                chunk_preview = chunk.text[:100] if chunk else ""
                await params.result_callback(
                    f'Book "{book.title}" loaded. '
                    f"Child has progress — resuming at chunk {progress}. "
                    f'Last passage: "{chunk_preview}..."'
                )
            else:
                await params.result_callback(
                    f'Book "{book.title}" loaded. This is a new book — no prior progress.'
                )
            await state_manager.queue_frame(
                BookSelectedFrame(book_id=book.id, book_title=book.title),
                FrameDirection.DOWNSTREAM,
            )
            logger.info(f"[Bot] BookSelected frame queued: {book.id}")
        else:
            await params.result_callback("Book not found.")

    async def handle_start_reading(params):
        raw_id = params.arguments["book_id"]
        resolved_id = state_manager.resolve_book_id(raw_id)
        await params.result_callback("Starting to read.")
        await state_manager.queue_frame(
            StartReadingFrame(
                book_id=resolved_id,
                chunk_index=params.arguments.get("chunk_id"),
            ),
            FrameDirection.DOWNSTREAM,
        )
        logger.info(f"[Bot] StartReading frame queued: {resolved_id}")

    async def handle_end_session(params):
        await params.result_callback("Ending session.")
        await state_manager.queue_frame(
            EndSessionFrame(reason="user_goodbye"),
            FrameDirection.DOWNSTREAM,
        )
        logger.info("[Bot] EndSession frame queued")

    if not book_id:
        llm.register_function("list_books", handle_list_books)
    llm.register_function("select_book", handle_select_book)
    llm.register_function("start_reading", handle_start_reading)
    llm.register_function("end_session", handle_end_session)

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            user_agg,
            llm,
            state_manager,
            tts,
            transport.output(),
            assistant_agg,
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            audio_out_sample_rate=44100,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    async def send_disconnect():
        logger.info("Sending RTVI UserVerballyInitiatedDisconnect")
        await task.rtvi.send_server_message({"type": "UserVerballyInitiatedDisconnect"})

    state_manager.set_disconnect_callback(send_disconnect)

    @task.rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi):
        logger.info("RTVI client-ready received")

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, participant):
        logger.info("Client connected — triggering greeting")
        await state_manager.greet_child()

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Client disconnected — saving progress")
        library.save_progress()
        await task.cancel()

    runner = PipelineRunner(handle_sigint=runner_args.handle_sigint)
    await runner.run(task)


async def bot(runner_args: RunnerArguments):
    """Main bot entry point — compatible with Pipecat Cloud, Modal, and local runner."""
    body = runner_args.body or {}
    book_id = body.get("book_id")
    kid_id = body.get("kid_id")

    logger.info(
        f"bot() invoked with runner_args={type(runner_args).__name__}, book_id={book_id}, kid_id={kid_id}"
    )
    transport_params = {
        "daily": lambda: DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
        ),
        "webrtc": lambda: TransportParams(
            audio_out_enabled=True,
            audio_in_enabled=True,
            video_out_enabled=False,
            video_in_enabled=False,
        ),
    }
    transport = await create_transport(runner_args, transport_params)
    logger.info(f"Transport created: {type(transport).__name__}")
    await run_bot(transport, runner_args, book_id=book_id, kid_id=kid_id)


if __name__ == "__main__":
    from pipecat.runner.run import main

    main()
