from __future__ import annotations

import sys
from pathlib import Path

# Minimal bootstrap so we can import from infra.common
_repo = Path(__file__).resolve().parent.parent
if str(_repo) not in sys.path:
    sys.path.insert(0, str(_repo))

from infra.common import app, bootstrap_infra_imports  # noqa: E402

bootstrap_infra_imports()

import infra.modal_api  # noqa: F401, E402
import infra.modal_jobs  # noqa: F401, E402

__all__ = ["app"]
