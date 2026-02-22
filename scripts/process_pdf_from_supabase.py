#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pypdf>=5.0.0",
#   "PyMuPDF>=1.24.0",
#   "pillow>=10.0.0",
#   "pytesseract>=0.3.10",
#   "python-dotenv>=1.2.1",
#   "google-genai>=1.63.0",
#   "pydantic>=2.0.0",
#   "tenacity>=9.0.0",
# ]
# ///
"""
Plan B PDF processing:
1) Extract raw page text from PDF (native text + OCR fallback).
2) Send small page batches to Gemini Flash-Lite.
3) Let the LLM do cleanup + semantic chunking + chapter transitions.

This script keeps post-processing intentionally minimal.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import tempfile
import time
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from functools import cache
from pathlib import Path
from typing import Any, Literal, TypeVar, cast, get_origin

import fitz  # PyMuPDF
import pytesseract
from dotenv import load_dotenv
from google.genai import Client, types
from PIL import Image
from pydantic import BaseModel, Field
from pypdf import PdfReader
from tenacity import Retrying, retry_if_exception, stop_after_attempt, wait_exponential_jitter


SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"
SUPABASE_BUCKET = "books"
SUPABASE_OBJECT_PATH = "uploads/sample.pdf"
LOCAL_TEST_PDF_PATH = Path(
    "/Users/isabelleredactive/Downloads/Stories for Kids_ Raymond Mayweather and the Cold Planet.pdf"
)

BOOK_ID = "book_demo_001"
OUTPUT_PATH = Path("scripts/output/local_pdf_chunks_plan_b.json")
MIN_TEXT_WORDS_BEFORE_OCR = 25

PAGES_PER_BATCH = 3
MAX_PAGES: int | None = None
MAX_CHUNK_WORDS = 260
LLM_MODEL = "gemini-2.5-flash-lite-preview-09-2025"
API_KEY_ENV = "GOOGLE_API_KEY"
REQUEST_DELAY_SECONDS = 0.0
MAX_RETRIES = 6


@dataclass(slots=True)
class PageText:
    page_number: int
    text: str


@dataclass(slots=True)
class Chunk:
    chunk_id: str
    chunk_kind: str  # chapter_title | content
    book_id: str
    chapter_id: str
    chapter_title: str
    page_start: int
    page_end: int
    text: str


@dataclass(slots=True)
class Chapter:
    chapter_id: str
    title: str
    start_page: int
    end_page: int


class BookChunkLLMResponseModel(BaseModel):
    chunk_kind: Literal["chapter_title", "content"] = Field(
        description="Chunk type: chapter_title emits a heading-only chunk, content emits spoken body text."
    )
    chapter_title: str = Field(
        description="Chapter title this chunk belongs to. For chapter_title chunks, this should match the heading text."
    )
    page_start: int | None = Field(
        default=None,
        description="1-based PDF page index where the chunk starts. Null means it was not confidently identified.",
    )
    page_end: int | None = Field(
        default=None,
        description="1-based PDF page index where the chunk ends. Null means it was not confidently identified.",
    )
    text: str = Field(
        description="Verbatim cleaned text that will be spoken. Chapter headings should not be duplicated in content chunks."
    )


class BookChunkBatchLLMResponseModel(BaseModel):
    book_title_guess: str = Field(
        description="Best-effort title guess for the book, or empty string when unknown."
    )
    current_chapter_out: str = Field(
        description="Chapter state after processing this page batch; reused as input for the next batch."
    )
    carryover_text: str = Field(
        description="Trailing incomplete text to prepend to the next page batch, or empty string."
    )
    chunks: list[BookChunkLLMResponseModel] = Field(
        description="Ordered chunk list generated from the current page batch."
    )


class GeminiCouldntStructureOutput(RuntimeError):
    pass


T = TypeVar("T")


def build_public_object_url(url: str, bucket: str, object_path: str) -> str:
    object_path_safe = urllib.parse.quote(object_path.lstrip("/"))
    return f"{url.rstrip('/')}/storage/v1/object/public/{bucket}/{object_path_safe}"


def download_pdf(url: str) -> Path:
    tmp_file = tempfile.NamedTemporaryFile(prefix="book_", suffix=".pdf", delete=False)
    tmp_path = Path(tmp_file.name)
    tmp_file.close()
    with urllib.request.urlopen(url, timeout=60) as response:
        tmp_path.write_bytes(response.read())
    return tmp_path


def _ocr_page(doc: "fitz.Document", page_index: int) -> str:
    page = doc.load_page(page_index)
    pixmap = page.get_pixmap(dpi=280, alpha=False)
    image = Image.open(io.BytesIO(pixmap.tobytes("png")))
    return pytesseract.image_to_string(image) or ""


def extract_raw_pages(pdf_path: Path) -> list[PageText]:
    reader = PdfReader(str(pdf_path))
    ocr_doc = fitz.open(str(pdf_path))
    pages: list[PageText] = []
    try:
        for idx, page in enumerate(reader.pages):
            text = (page.extract_text() or "").strip()
            if len(text.split()) < MIN_TEXT_WORDS_BEFORE_OCR:
                try:
                    ocr_text = _ocr_page(ocr_doc, idx).strip()
                    if len(ocr_text.split()) > len(text.split()):
                        text = ocr_text
                except Exception:
                    pass
            pages.append(PageText(page_number=idx + 1, text=text))
    finally:
        ocr_doc.close()
    return pages


def limit_to_first_n_pages(pages: list[PageText], max_pages: int | None) -> list[PageText]:
    if not max_pages or max_pages < 1:
        return pages
    return pages[:max_pages]


def iter_page_batches(pages: list[PageText], pages_per_batch: int) -> list[list[PageText]]:
    return [pages[i : i + pages_per_batch] for i in range(0, len(pages), pages_per_batch)]


def normalize_for_compare(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def text_starts_with_prefix(text: str, prefix: str, compare_chars: int = 80) -> bool:
    if not prefix.strip():
        return True
    t_norm = normalize_for_compare(text)
    p_norm = normalize_for_compare(prefix)
    head = p_norm[:compare_chars]
    return bool(head) and t_norm.startswith(head)


def strip_code_fence(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z0-9_-]*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
    return cleaned.strip()


@cache
def get_genai_client(api_key: str) -> Client:
    return Client(api_key=api_key)


def _is_quota_error(error: Exception) -> bool:
    message = str(error).upper()
    return "429" in message or "RESOURCE_EXHAUSTED" in message


def gemini_generate_structured_output(
    prompt: str,
    model: str,
    api_key: str,
    result_type: type[T],
    request_delay_seconds: float = REQUEST_DELAY_SECONDS,
    max_retries: int = MAX_RETRIES,
) -> T:
    if request_delay_seconds > 0:
        time.sleep(request_delay_seconds)

    client = get_genai_client(api_key=api_key)
    retryer = Retrying(
        retry=retry_if_exception(_is_quota_error),
        stop=stop_after_attempt(max_retries + 1),
        wait=wait_exponential_jitter(initial=2, max=60, jitter=3),
        reraise=True,
    )

    for attempt in retryer:
        with attempt:
            response = client.models.generate_content(
                model=model,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    response_mime_type="application/json",
                    response_schema=result_type,
                ),
            )
            # GenAI already validates against the supplied response schema.
            check_type = get_origin(result_type) or result_type
            if response.parsed is None or not isinstance(response.parsed, check_type):
                raise GeminiCouldntStructureOutput(
                    f"Gemini could not generate output matching {result_type}. Output: {strip_code_fence(response.text or '')}"
                )
            return cast(T, response.parsed)
    raise RuntimeError("Gemini retry loop exhausted without a response.")


def _chunk_page_batch_prompt(
    page_batch: list[PageText],
    carryover_text: str,
    current_chapter: str,
    max_chunk_words: int,
) -> str:
    page_min = page_batch[0].page_number
    page_max = page_batch[-1].page_number
    batch_text = "\n\n".join(f"[[PAGE {p.page_number}]]\n{p.text}" for p in page_batch)
    return f"""
You prepare clean spoken chunks for TTS from raw PDF/OCR text.

Critical rules:
- The output will be spoken aloud.
- Remove non-spoken artifacts (headers, footers, navigation labels, page furniture, URLs, cookie banners).
- Reproduce source wording exactly for kept content. Do not paraphrase, summarize, or rewrite style.
- Keep chunks semantically complete and do not cut mid-sentence.
- Target <= {max_chunk_words} words per content chunk.
- Use only page numbers from [[PAGE N]] markers.

Chapter-state rules:
- Current chapter entering this page batch: "{current_chapter}" (empty means unknown).
- If you do NOT find a new chapter heading, keep using current chapter and set current_chapter_out unchanged.
- If you find a new chapter heading:
  1) Emit a separate chunk with chunk_kind="chapter_title" where text is the heading only.
  2) Set current_chapter_out to that heading.
  3) Do NOT include heading text again in nearby content chunks.

Carryover rules:
- carryover_text_in may contain trailing incomplete text from the previous page batch.
- If carryover_text_in is non-empty, continue from it before new page content.
- Return new carryover_text only when this page batch ends with incomplete trailing text.

Return STRICT JSON only:
{{
  "book_title_guess": "string or empty",
  "current_chapter_out": "string (updated or unchanged)",
  "carryover_text": "string (possibly empty)",
  "chunks": [
    {{
      "chunk_kind": "chapter_title|content",
      "chapter_title": "chapter this chunk belongs to",
      "page_start": 1,
      "page_end": 2,
      "text": "chunk text"
    }}
  ]
}}

Page batch: {page_min}-{page_max}
current_chapter_in:
{current_chapter}

carryover_text_in:
{carryover_text}

Raw page text:
{batch_text}
""".strip()


def llm_chunk_page_batch(
    page_batch: list[PageText],
    carryover_text: str,
    current_chapter: str,
    api_key: str,
    model: str,
    max_chunk_words: int,
    request_delay_seconds: float,
    max_retries: int,
) -> dict[str, Any]:
    result = gemini_generate_structured_output(
        prompt=_chunk_page_batch_prompt(
            page_batch=page_batch,
            carryover_text=carryover_text,
            current_chapter=current_chapter,
            max_chunk_words=max_chunk_words,
        ),
        model=model,
        api_key=api_key,
        result_type=BookChunkBatchLLMResponseModel,
        request_delay_seconds=request_delay_seconds,
        max_retries=max_retries,
    )

    min_page = page_batch[0].page_number
    max_page = page_batch[-1].page_number
    chunks: list[dict[str, Any]] = []
    for raw in result.chunks:
        chunk_kind = raw.chunk_kind.strip().lower()
        chapter_title = raw.chapter_title.strip()
        text = raw.text.replace("\u0000", " ").strip()
        if chunk_kind == "chapter_title":
            if not text:
                continue
            if not chapter_title:
                chapter_title = text
        else:
            if not text:
                continue
        page_start_raw = raw.page_start if raw.page_start is not None else min_page
        page_end_raw = raw.page_end if raw.page_end is not None else page_start_raw
        page_start = max(min_page, min(max_page, page_start_raw))
        page_end = max(page_start, min(max_page, page_end_raw))
        chunks.append(
            {
                "chunk_kind": chunk_kind,
                "chapter_title": chapter_title[:160],
                "page_start": page_start,
                "page_end": page_end,
                "text": text,
            }
        )

    carryover_applied_hint = True
    if chunks and carryover_text.strip():
        carryover_applied_hint = text_starts_with_prefix(chunks[0]["text"], carryover_text)

    return {
        "book_title_guess": result.book_title_guess.strip(),
        "current_chapter_out": result.current_chapter_out.strip(),
        "carryover_text": result.carryover_text.strip(),
        "chunks": chunks,
        "carryover_applied_hint": carryover_applied_hint,
    }


def fallback_title(pages: list[PageText]) -> str:
    if not pages:
        return "Untitled Book"
    for line in pages[0].text.splitlines():
        candidate = line.strip()
        if len(candidate) >= 3:
            return candidate[:160]
    return "Untitled Book"


def build_chunks_and_chapters(raw_chunks: list[dict[str, Any]], book_id: str) -> tuple[list[Chunk], list[Chapter]]:
    chunks: list[Chunk] = []
    chapter_id_by_title: dict[str, str] = {}
    chapters_by_id: dict[str, Chapter] = {}

    current_chapter_title = "Unknown Chapter"
    chapter_counter = 1
    chunk_counter = 0

    def ensure_chapter(title: str, page_start: int, page_end: int) -> str:
        nonlocal chapter_counter
        title_key = title.strip() or "Unknown Chapter"
        if title_key not in chapter_id_by_title:
            chapter_id = f"chapter_{chapter_counter:03d}"
            chapter_counter += 1
            chapter_id_by_title[title_key] = chapter_id
            chapters_by_id[chapter_id] = Chapter(
                chapter_id=chapter_id,
                title=title_key[:160],
                start_page=page_start,
                end_page=page_end,
            )
        chapter_id = chapter_id_by_title[title_key]
        chapter = chapters_by_id[chapter_id]
        chapter.start_page = min(chapter.start_page, page_start)
        chapter.end_page = max(chapter.end_page, page_end)
        return chapter_id

    for raw in raw_chunks:
        chunk_kind = raw["chunk_kind"]
        text = raw["text"]
        page_start = raw["page_start"]
        page_end = raw["page_end"]

        if chunk_kind == "chapter_title":
            current_chapter_title = text.strip() or raw.get("chapter_title", "").strip() or current_chapter_title
        elif raw.get("chapter_title", "").strip():
            current_chapter_title = raw["chapter_title"].strip()

        chapter_id = ensure_chapter(current_chapter_title, page_start, page_end)
        chunks.append(
            Chunk(
                chunk_id=f"chunk_{chunk_counter:05d}",
                chunk_kind=chunk_kind,
                book_id=book_id,
                chapter_id=chapter_id,
                chapter_title=current_chapter_title,
                page_start=page_start,
                page_end=page_end,
                text=text,
            )
        )
        chunk_counter += 1

    chapters = list(chapters_by_id.values())
    chapters.sort(key=lambda c: (c.start_page, c.chapter_id))
    return chunks, chapters


def process_pdf(
    book_id: str,
    output_path: Path,
    pages_per_batch: int,
    max_pages: int | None,
    max_chunk_words: int,
    api_key: str,
    llm_model: str,
    request_delay_seconds: float,
    max_retries: int,
    source_url: str | None = None,
    local_pdf_path: Path | None = None,
) -> None:
    if local_pdf_path is not None:
        if not local_pdf_path.exists():
            raise FileNotFoundError(f"Local PDF not found: {local_pdf_path}")
        pdf_path = local_pdf_path
        cleanup_pdf = False
        source_metadata = {"type": "local_file", "path": str(local_pdf_path)}
    else:
        if not source_url:
            raise ValueError("source_url is required when local_pdf_path is not set")
        pdf_path = download_pdf(source_url)
        cleanup_pdf = True
        source_metadata = {"type": "supabase_storage_public_url", "url": source_url}

    try:
        pages = extract_raw_pages(pdf_path)
        pages = limit_to_first_n_pages(pages, max_pages=max_pages)
        page_batches = iter_page_batches(pages, pages_per_batch=pages_per_batch)

        title_guess = ""
        current_chapter = ""
        carryover = ""
        raw_chunks: list[dict[str, Any]] = []
        carryover_batches: list[dict[str, Any]] = []

        for batch_index, page_batch in enumerate(page_batches, start=1):
            carryover_in = carryover
            chapter_in = current_chapter
            llm_result = llm_chunk_page_batch(
                page_batch=page_batch,
                carryover_text=carryover_in,
                current_chapter=chapter_in,
                api_key=api_key,
                model=llm_model,
                max_chunk_words=max_chunk_words,
                request_delay_seconds=request_delay_seconds,
                max_retries=max_retries,
            )

            if not title_guess and llm_result["book_title_guess"]:
                title_guess = llm_result["book_title_guess"]

            raw_chunks.extend(llm_result["chunks"])
            current_chapter = llm_result["current_chapter_out"] or current_chapter
            carryover = llm_result["carryover_text"]

            carryover_batches.append(
                {
                    "batch_index": batch_index,
                    "page_start": page_batch[0].page_number,
                    "page_end": page_batch[-1].page_number,
                    "current_chapter_in": chapter_in,
                    "current_chapter_out": current_chapter,
                    "carryover_in_len": len(carryover_in),
                    "carryover_out_len": len(carryover),
                    "carryover_applied_hint": llm_result["carryover_applied_hint"],
                }
            )

        chunks, chapters = build_chunks_and_chapters(raw_chunks=raw_chunks, book_id=book_id)
        title = title_guess or fallback_title(pages)

        result = {
            "book_id": book_id,
            "title": title,
            "source": source_metadata,
            "llm": {
                "provider": "google_gemini",
                "model": llm_model,
                "pages_per_batch": pages_per_batch,
                "max_chunk_words_target": max_chunk_words,
                "request_delay_seconds": request_delay_seconds,
                "max_retries": max_retries,
            },
            "chapters": [asdict(chapter) for chapter in chapters],
            "chunks": [asdict(chunk) for chunk in chunks],
            "carryover_batches": carryover_batches,
            "stats": {
                "pages_total": len(pages),
                "chapters_total": len(chapters),
                "chunks_total": len(chunks),
            },
        }
        if max_pages:
            result["limits"] = {"max_pages": max_pages}

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    finally:
        if cleanup_pdf:
            pdf_path.unlink(missing_ok=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Plan B: raw extraction + LLM cleanup/chunking (chapter-state + carryover aware)."
    )
    parser.add_argument("--book-id", default=BOOK_ID, help="Stable book ID to attach to chunks.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH, help=f"Output JSON path ({OUTPUT_PATH}).")
    parser.add_argument(
        "--pages-per-batch",
        "--window-pages",
        dest="pages_per_batch",
        type=int,
        default=PAGES_PER_BATCH,
        help=f"Pages sent to Gemini per request (default: {PAGES_PER_BATCH}).",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=MAX_PAGES,
        help="Only process first N pages.",
    )
    parser.add_argument(
        "--max-chunk-words",
        type=int,
        default=MAX_CHUNK_WORDS,
        help=f"Target max words per content chunk (default: {MAX_CHUNK_WORDS}).",
    )
    parser.add_argument(
        "--llm-model",
        default=LLM_MODEL,
        help=f"Gemini model name (default: {LLM_MODEL}).",
    )
    parser.add_argument(
        "--request-delay-seconds",
        type=float,
        default=REQUEST_DELAY_SECONDS,
        help=f"Sleep before each LLM request (default: {REQUEST_DELAY_SECONDS}).",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=MAX_RETRIES,
        help=f"Max retries on quota errors (default: {MAX_RETRIES}).",
    )
    parser.add_argument(
        "--api-key-env",
        default=API_KEY_ENV,
        help=f"Environment variable for API key (default: {API_KEY_ENV}).",
    )
    parser.add_argument(
        "--local-pdf",
        type=Path,
        default=LOCAL_TEST_PDF_PATH,
        help=f"Local PDF path (default: {LOCAL_TEST_PDF_PATH}).",
    )
    parser.add_argument("--source-url", default=None, help="Override Supabase URL when local file is absent.")
    return parser.parse_args()


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    load_dotenv()
    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root / "server" / ".env")

    args = parse_args()
    api_key = os.getenv(args.api_key_env, "").strip()
    if not api_key:
        raise RuntimeError(f"Missing API key. Set {args.api_key_env} before running.")

    if args.local_pdf is not None and args.local_pdf.exists():
        source_url = None
        local_pdf_path = args.local_pdf
    else:
        source_url = args.source_url or build_public_object_url(
            SUPABASE_URL, SUPABASE_BUCKET, SUPABASE_OBJECT_PATH
        )
        local_pdf_path = None

    process_pdf(
        book_id=args.book_id,
        output_path=args.output,
        pages_per_batch=args.pages_per_batch,
        max_pages=args.max_pages,
        max_chunk_words=args.max_chunk_words,
        api_key=api_key,
        llm_model=args.llm_model,
        request_delay_seconds=args.request_delay_seconds,
        max_retries=args.max_retries,
        source_url=source_url,
        local_pdf_path=local_pdf_path,
    )
    print(f"Wrote processed chunks to {args.output}")


if __name__ == "__main__":
    main()
