import sys
from pathlib import Path
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from server.api.main import app
import server.api.admin as admin


def _post_upload(
    client: TestClient,
    household_id: str | None,
    filename: str = "book.pdf",
    content: bytes = b"dummy-pdf",
    content_type: str = "application/pdf",
):
    data = {}
    if household_id is not None:
        data["household_id"] = household_id
    return client.post(
        "/admin/books/upload",
        data=data,
        files={"file": (filename, content, content_type)},
    )


def test_upload_success_returns_processing_status() -> None:
    client = TestClient(app)
    household_id = "11111111-1111-1111-1111-111111111111"

    mock_client = Mock()
    mock_bucket = Mock()
    mock_client.storage.from_.return_value = mock_bucket
    mock_insert_builder = Mock()
    mock_table = Mock()
    mock_client.table.return_value = mock_table
    mock_table.insert.return_value = mock_insert_builder
    mock_insert_builder.execute.return_value = {"data": []}

    with (
        patch.object(admin, "_supabase_client", return_value=mock_client),
        patch.object(admin, "enqueue_process_book") as enqueue_mock,
    ):
        response = _post_upload(client=client, household_id=household_id)

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "processing"
    assert payload["household_id"] == household_id
    assert payload["storage_path"].startswith(f"{household_id}/books/")
    assert payload["storage_path"].endswith(".pdf")

    mock_client.storage.from_.assert_called_once_with(admin.SUPABASE_BOOKS_BUCKET)
    mock_bucket.upload.assert_called_once()
    upload_kwargs = mock_bucket.upload.call_args.kwargs
    assert upload_kwargs["file"] == b"dummy-pdf"
    assert upload_kwargs["file_options"]["content-type"] == "application/pdf"

    mock_client.table.assert_called_once_with("books")
    mock_table.insert.assert_called_once()
    insert_payload = mock_table.insert.call_args.args[0]
    assert insert_payload["household_id"] == household_id
    assert insert_payload["status"] == "processing"
    assert insert_payload["storage_path"] == payload["storage_path"]
    enqueue_mock.assert_called_once_with(payload["book_id"])


def test_upload_requires_household_id() -> None:
    client = TestClient(app)
    response = _post_upload(client=client, household_id=None)
    assert response.status_code == 422


def test_upload_requires_valid_household_id() -> None:
    client = TestClient(app)
    response = _post_upload(client=client, household_id="not-a-uuid")
    assert response.status_code == 422


def test_upload_rejects_non_pdf_file_extension() -> None:
    client = TestClient(app)
    response = _post_upload(
        client=client,
        household_id="11111111-1111-1111-1111-111111111111",
        filename="notes.txt",
        content=b"hello",
        content_type="text/plain",
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Only PDF files are supported."


def test_upload_rejects_invalid_pdf_content_type() -> None:
    client = TestClient(app)
    response = _post_upload(
        client=client,
        household_id="11111111-1111-1111-1111-111111111111",
        filename="book.pdf",
        content=b"hello",
        content_type="text/plain",
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid content type. Expected a PDF."


def test_upload_rejects_empty_file() -> None:
    client = TestClient(app)
    response = _post_upload(
        client=client,
        household_id="11111111-1111-1111-1111-111111111111",
        filename="book.pdf",
        content=b"",
        content_type="application/pdf",
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Uploaded file is empty."


def test_upload_returns_500_when_storage_or_db_fails() -> None:
    client = TestClient(app)
    household_id = "11111111-1111-1111-1111-111111111111"

    mock_client = Mock()
    mock_bucket = Mock()
    mock_client.storage.from_.return_value = mock_bucket
    mock_bucket.upload.side_effect = RuntimeError("boom")

    with (
        patch.object(admin, "_supabase_client", return_value=mock_client),
        patch.object(admin, "enqueue_process_book") as enqueue_mock,
        patch.object(admin.logger, "exception"),
    ):
        response = _post_upload(client=client, household_id=household_id)

    assert response.status_code == 500
    assert "Upload failed" in response.json()["detail"]
    enqueue_mock.assert_not_called()
