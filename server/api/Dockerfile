FROM ghcr.io/astral-sh/uv:python3.13-bookworm

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_PYTHON=3.13

WORKDIR /workspace/server

COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-install-project --no-dev

COPY api ./api
COPY shared ./shared
COPY worker ./worker

CMD ["uv", "run", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
