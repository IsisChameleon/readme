from fastapi import FastAPI

try:
    from .admin import router as admin_router
except ImportError:
    from server.api.admin import router as admin_router  # type: ignore

app = FastAPI(title="Readme API", version="0.1.0")
app.include_router(admin_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
