from __future__ import annotations

import modal

from infra.common import app, bootstrap_repo, bot_image, config, secrets, worker_image

# ── Bot (one voice call per container, with memory snapshot) ─────────


@app.cls(
    image=bot_image,
    secrets=secrets,
    region=[config.region],
    timeout=30 * 60,
    scaledown_window=300,
    enable_memory_snapshot=True,
)
@modal.concurrent(max_inputs=1)
class BotSession:
    """One instance per voice call."""

    @modal.enter(snap=True)
    def preload(self):
        """Pre-load heavy modules — this state gets snapshotted."""
        bootstrap_repo()
        import pipecat.audio.vad.silero  # noqa: F401
        import pipecat.pipeline.pipeline  # noqa: F401
        import pipecat.services.cartesia.tts  # noqa: F401
        import pipecat.services.deepgram.stt  # noqa: F401
        import pipecat.services.openai.llm  # noqa: F401

    @modal.method()
    async def run(self, room_url: str, token: str) -> None:
        from bot.bot import bot
        from pipecat.runner.types import DailyRunnerArguments

        await bot(DailyRunnerArguments(room_url=room_url, token=token))


@app.function(
    image=bot_image,
    secrets=secrets,
    region=[config.region],
    timeout=30 * 60,
)
async def run_bot_session(room_url: str, token: str) -> None:
    """Spawnable entry point — delegates to BotSession for snapshot benefits."""
    await BotSession().run.remote.aio(room_url=room_url, token=token)


# ── Worker (PDF processing) ─────────────────────────────────────────


@app.function(
    image=worker_image,
    secrets=secrets,
    region=[config.region],
    retries=2,
    timeout=10 * 60,
)
def process_book(book_id: str) -> None:
    bootstrap_repo()

    from workers.book_processor_jobs import process_book_job

    process_book_job(book_id)


@app.function(
    image=worker_image,
    secrets=secrets,
    region=[config.region],
    retries=2,
    timeout=10 * 60,
)
def rechunk_book(book_id: str) -> None:
    bootstrap_repo()

    from workers.book_processor_jobs import rechunk_book_job

    rechunk_book_job(book_id)
