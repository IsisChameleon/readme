from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from loguru import logger
from pydantic import BaseModel
from supabase import Client, create_client

from shared.config import settings
from workers.book_processor_jobs import process_book_job
from workers.pdf_pipeline import set_book_status

router = APIRouter(prefix="/books", tags=["books"])


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
    if not settings.supabase.url or not settings.supabase.secret_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.",
        )
    return create_client(settings.supabase.url, settings.supabase.secret_key)


def _dispatch_process_book(book_id: str, background_tasks: BackgroundTasks) -> None:
    if settings.modal.app_name:
        import modal  # type: ignore[import-untyped]

        modal.Function.from_name(settings.modal.app_name, "process_book").spawn(book_id)
        return
    background_tasks.add_task(process_book_job, book_id)


@router.post("/upload", response_model=UploadBookResponse)
async def upload_book(
    background_tasks: BackgroundTasks,
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
    if len(payload) > settings.upload.max_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file exceeds the size limit.")

    book_id = str(uuid4())
    storage_path = f"households/{request.household_id}/books/{book_id}/{filename}"
    title = Path(filename).stem
    client = _supabase_client()

    try:
        client.storage.from_(settings.supabase.books_bucket).upload(
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

    try:
        _dispatch_process_book(book_id, background_tasks)
    except Exception as exc:
        logger.exception("Failed to start background book processing | book_id={}", book_id)
        set_book_status(book_id, "error")
        raise HTTPException(
            status_code=500,
            detail="Upload succeeded but background processing could not be started.",
        ) from exc

    return UploadBookResponse(
        book_id=book_id,
        household_id=request.household_id,
        status="processing",
        storage_path=storage_path,
    )
