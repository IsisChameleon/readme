# Upload Admin API and OpenAPI Verification Checklist

Last updated: 2026-02-21
Scope: Validate admin PDF upload, household-scoped storage path, migration shape, and OpenAPI typegen integration.

## How to run

```bash
bash /Users/isabelleredactive/src/readme/.agents/plan/upload-admin-api-openapi-verification.sh
```

## Automated checks (script)

- [ ] Server modules compile (`server/api`, `server/shared`, `server/worker`)
- [ ] OpenAPI export script runs
- [ ] OpenAPI TypeScript generation runs
- [ ] Client lint passes
- [ ] Server endpoint unit tests pass
- [ ] FastAPI contract tests pass:
  - [ ] `/health` returns `200`
  - [ ] `/admin/books/upload` present in OpenAPI
  - [ ] missing `household_id` returns `422`
  - [ ] invalid UUID `household_id` returns `422`
  - [ ] non-PDF filename returns `400`
  - [ ] invalid content type for `.pdf` returns `400`
  - [ ] empty file returns `400`
  - [ ] missing Supabase config on valid payload returns `500`

## Manual checks (requires Supabase project)

- [ ] `books` bucket exists in Supabase Storage (name = `SUPABASE_BOOKS_BUCKET`)
- [ ] `0001_books.sql` applied in Supabase SQL editor
- [ ] API success path with real PDF upload returns `200` and `book_id`
- [ ] Uploaded object appears at `/{household_id}/books/{book_id}.pdf`
- [ ] `books` row created with `household_id`, `storage_path`, `status='uploaded'`
- [ ] If Dramatiq is configured, response `queue_status='queued'` and worker logs message

## Manual success-path command

```bash
curl -X POST http://localhost:8000/admin/books/upload \
  -F "household_id=11111111-1111-1111-1111-111111111111" \
  -F "file=@/absolute/path/to/book.pdf;type=application/pdf"
```
