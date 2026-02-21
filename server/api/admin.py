from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from loguru import logger
from pydantic import BaseModel
from supabase import Client, create_client

try:
    from shared.config import SUPABASE_BOOKS_BUCKET, SUPABASE_SECRET_KEY, SUPABASE_URL
    from worker.tasks import enqueue_process_book
except ImportError:
    from server.shared.config import (  # type: ignore
        SUPABASE_BOOKS_BUCKET,
        SUPABASE_SECRET_KEY,
        SUPABASE_URL,
    )
    from server.worker.tasks import enqueue_process_book  # type: ignore


router = APIRouter(prefix="/admin", tags=["admin"])


class UploadBookRequest(BaseModel):
    household_id: str

    @classmethod
    def as_form(
        cls,
        household_id: Annotated[str, Form(...)],
    ) -> "UploadBookRequest":
        return cls(household_id=household_id)


class UploadBookResponse(BaseModel):
    book_id: str
    household_id: str
    status: Literal["processing"]
    storage_path: str


UploadBookRequestForm = Annotated[UploadBookRequest, Depends(UploadBookRequest.as_form)]


def _supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.",
        )
    return create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


@router.post("/books/upload", response_model=UploadBookResponse)
async def upload_book(
    request: UploadBookRequestForm,
    file: UploadFile = File(...),
) -> UploadBookResponse:
    if not request.household_id.strip():
        raise HTTPException(status_code=422, detail="household_id is required.")

    filename = Path(file.filename or "book.pdf").name
    content_type = file.content_type or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    if content_type and content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Invalid content type. Expected a PDF.")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    book_id = str(uuid4())
    storage_path = f"households/{request.household_id}/books/{book_id}/{filename}"
    title = Path(filename).stem
    client = _supabase_client()

    try:
        client.storage.from_(SUPABASE_BOOKS_BUCKET).upload(
            path=storage_path,
            file=payload,
            file_options={"content-type": "application/pdf", "upsert": "false"},
        )
        client.table("books").insert(
            {
                "id": book_id,
                "household_id": request.household_id,
                "title": title,
                "storage_path": storage_path,
                "status": "processing",
            }
        ).execute()
    except Exception as exc:
        logger.exception("Failed to upload PDF or create books row")
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc
    finally:
        await file.close()

    enqueue_process_book(book_id)
    return UploadBookResponse(
        book_id=book_id,
        household_id=request.household_id,
        status="processing",
        storage_path=storage_path,
    )
