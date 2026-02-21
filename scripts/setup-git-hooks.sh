#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
git config core.hooksPath "$ROOT_DIR/.githooks"
echo "Configured core.hooksPath=$ROOT_DIR/.githooks"

