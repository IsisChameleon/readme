"""Root-level Pipecat bot entrypoint shim.

This lets `python -m pipecat.runner.run` discover `bot(runner_args)` even when
started from the repository root instead of the `server` directory.
"""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys

_SERVER_BOT_DIR = Path(__file__).resolve().parent / "server" / "bot"
_SERVER_BOT_FILE = _SERVER_BOT_DIR / "bot.py"

# Ensure local prompt imports inside server/bot/bot.py can resolve.
if str(_SERVER_BOT_DIR) not in sys.path:
    sys.path.insert(0, str(_SERVER_BOT_DIR))

_spec = spec_from_file_location("_server_bot_entry", _SERVER_BOT_FILE)
if _spec is None or _spec.loader is None:
    raise ImportError(f"Could not load bot module from {_SERVER_BOT_FILE}")

_module = module_from_spec(_spec)
_spec.loader.exec_module(_module)

bot = _module.bot
run_bot = _module.run_bot

__all__ = ["bot", "run_bot"]
