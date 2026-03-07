import sys
from pathlib import Path

# Ensure server/ is FIRST on sys.path so `bot` resolves to server/bot/ (package)
# and not the repo-root bot.py shim that other test modules add via their sys.path hacks.
_server_dir = str(Path(__file__).resolve().parents[2])
if _server_dir in sys.path:
    sys.path.remove(_server_dir)
sys.path.insert(0, _server_dir)

# If bot was already imported as a module (from repo-root bot.py), remove it
# so our package import works.
for key in list(sys.modules):
    if key == "bot" or key.startswith("bot."):
        del sys.modules[key]
