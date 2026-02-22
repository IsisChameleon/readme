#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
PYTHON_BIN="$ROOT_DIR/server/.venv/bin/python"
export PYTHONPATH="$ROOT_DIR${PYTHONPATH:+:$PYTHONPATH}"

if [[ ! -x "$PYTHON_BIN" ]]; then
  PYTHON_BIN="python3"
fi

pass() {
  printf "[PASS] %s\n" "$1"
}

fail() {
  printf "[FAIL] %s\n" "$1"
  exit 1
}

run_step() {
  local name="$1"
  shift
  printf "\n[STEP] %s\n" "$name"
  if "$@"; then
    pass "$name"
  else
    fail "$name"
  fi
}

run_step "Compile server modules" \
  "$PYTHON_BIN" -m compileall "$ROOT_DIR/server/api" "$ROOT_DIR/server/shared" "$ROOT_DIR/server/worker"

run_step "Export OpenAPI schema from FastAPI" \
  "$PYTHON_BIN" "$ROOT_DIR/scripts/export_openapi.py"

run_step "Generate TypeScript OpenAPI types" \
  pnpm --dir "$ROOT_DIR/client" openapi:generate

run_step "Run client lint" \
  pnpm --dir "$ROOT_DIR/client" lint

run_step "Run server endpoint unit tests" \
  "$PYTHON_BIN" -m pytest "$ROOT_DIR/server/tests" -q

printf "\n[STEP] FastAPI contract checks\n"
"$PYTHON_BIN" - <<'PY'
from fastapi.testclient import TestClient

from server.api.main import app
import server.api.admin as admin

client = TestClient(app)

# health check
r = client.get("/health")
assert r.status_code == 200, r.text
assert r.json().get("status") == "ok"

# OpenAPI route presence
spec = client.get("/openapi.json")
assert spec.status_code == 200, spec.text
paths = spec.json().get("paths", {})
assert "/admin/books/upload" in paths

valid_household = "11111111-1111-1111-1111-111111111111"

# missing household_id
r = client.post(
    "/admin/books/upload",
    files={"file": ("book.pdf", b"abc", "application/pdf")},
)
assert r.status_code == 422, r.text

# invalid household_id
r = client.post(
    "/admin/books/upload",
    data={"household_id": "not-a-uuid"},
    files={"file": ("book.pdf", b"abc", "application/pdf")},
)
assert r.status_code == 422, r.text

# non-pdf filename
r = client.post(
    "/admin/books/upload",
    data={"household_id": valid_household},
    files={"file": ("book.txt", b"abc", "text/plain")},
)
assert r.status_code == 400, r.text

# invalid content type for .pdf
r = client.post(
    "/admin/books/upload",
    data={"household_id": valid_household},
    files={"file": ("book.pdf", b"abc", "text/plain")},
)
assert r.status_code == 400, r.text

# empty file
r = client.post(
    "/admin/books/upload",
    data={"household_id": valid_household},
    files={"file": ("book.pdf", b"", "application/pdf")},
)
assert r.status_code == 400, r.text

# force missing Supabase config for valid payload path
admin.SUPABASE_URL = ""
admin.SUPABASE_SECRET_KEY = ""
r = client.post(
    "/admin/books/upload",
    data={"household_id": valid_household},
    files={"file": ("book.pdf", b"abc", "application/pdf")},
)
assert r.status_code == 500, r.text

print("FastAPI contract checks passed")
PY
pass "FastAPI contract checks"

printf "\nAll automated checklist steps passed.\n"
