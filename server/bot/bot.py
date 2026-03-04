import os

from dotenv import load_dotenv
from loguru import logger
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
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.hume.tts import HumeTTSService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams

try:
    from .processors.book_reader import BookReaderProcessor
except ImportError:
    from processors.book_reader import BookReaderProcessor  # type: ignore[assignment]

load_dotenv(override=True)


async def run_bot(transport: BaseTransport, runner_args: RunnerArguments):
    """Pipeline: input → STT → user_agg → LLM → BookReader → assistant_agg → TTS → output."""
    logger.info(f"run_bot started with transport={type(transport).__name__}")

    # MVP: hardcoded demo values. Post-MVP these come from call state
    # (set by the API when creating a Daily room for a reading session).
    book_id = "book_demo_001"
    kid_id = "demo_kid"

    stt = DeepgramSTTService(
        api_key=os.environ["DEEPGRAM_API_KEY"],
    )

    tts = HumeTTSService(
        api_key=os.environ["HUME_API_KEY"],
        voice_id="f898a92e-685f-43fa-985b-a46920f0650b",
    )

    llm = OpenAILLMService(
        api_key=os.environ["OPENAI_API_KEY"],
        model="gpt-4",
    )

    context = LLMContext()
    agg_pair = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.2)),
        ),
    )
    user_agg = agg_pair.user()
    assistant_agg = agg_pair.assistant()

    book_reader = BookReaderProcessor(kid_id=kid_id, context=context)

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            user_agg,
            llm,
            book_reader,
            assistant_agg,
            tts,
            transport.output(),
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

    @task.rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi):
        logger.info("RTVI client-ready received")
        await book_reader.initialize_book(book_id)

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, participant):
        logger.info("Client connected")

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Client disconnected — saving progress")
        book_reader.save_progress()
        await task.cancel()

    runner = PipelineRunner(handle_sigint=runner_args.handle_sigint)
    await runner.run(task)


async def bot(runner_args: RunnerArguments):
    """Main bot entry point compatible with Pipecat Cloud."""
    logger.info(f"bot() invoked with runner_args={type(runner_args).__name__}")
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
    await run_bot(transport, runner_args)


if __name__ == "__main__":
    from pipecat.runner.run import main

    main()
