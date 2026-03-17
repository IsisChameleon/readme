from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .admin import router as admin_router
    from .start import router as start_router
except ImportError:
    from server.api.admin import router as admin_router  # type: ignore
    from server.api.start import router as start_router  # type: ignore

try:
    from services.daily import DailyAPI
    from shared.config import settings
except ImportError:
    from server.services.daily import DailyAPI  # type: ignore
    from server.shared.config import settings  # type: ignore


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        yield
    finally:
        await DailyAPI.shutdown()


app = FastAPI(title="Readme API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,  # type: ignore[arg-type]
    allow_origins=settings.cors.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)
app.include_router(start_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
