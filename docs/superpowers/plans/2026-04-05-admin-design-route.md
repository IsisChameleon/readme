# Plan: Admin Design Route

## Context

Adding an admin-only `/admin/design` route showcasing the EmberTales "Enchanted Forest" design system. This is a prelude to the full site redesign. The admin route will grow over time, so we invest in proper access control now (toocan pattern).

Following the toocan pattern: backend is the sole authority for admin status. The proxy calls `GET /admin/is-admin` to check — single source of truth, no duplicated config parsing.

---

## Step 1 — Backend: Admin config + endpoint

### 1a. Add `AdminSettings` to `server/shared/config.py`

No validator needed — TOML provides a native array, so Pydantic receives `list[str]` directly. No secrets to resolve either, so plain `BaseModel`:

```python
class AdminSettings(BaseModel):
    allowed_emails: list[str] = []
```

Add `admin: AdminSettings = AdminSettings()` to the `Settings` class.

### 1b. Add `[admin]` section to `server/settings.toml`

Native TOML array — clean multiline, easy to edit:

```toml
[admin]
allowed_emails = [
    "isabelle@example.com",
]
```

### 1c. Add admin check dependency in `server/api/deps.py`

`get_authenticated_user_id` already calls `client.auth.get_user(token)` which returns the full user (including email). Refactor slightly: extract a helper that returns both user_id and email, then build `check_is_admin` on top:

```python
async def check_is_admin(authorization: str = Header(...)) -> str:
    token = _extract_token(authorization)
    client = create_client(settings.supabase.url, settings.supabase.secret_key)
    result = client.auth.get_user(token)
    if not result or not result.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if result.user.email not in settings.admin.allowed_emails:
        raise HTTPException(status_code=403, detail="Forbidden")
    return result.user.id
```

### 1d. Add admin router — `server/api/routers/admin.py`

```python
router = APIRouter(prefix="/admin", dependencies=[Depends(check_is_admin)])

@router.get("/is-admin")
async def is_admin():
    return True
```

Register in `server/api/main.py`.

**Files:**
- `server/shared/config.py` — add `AdminSettings` + wire into `Settings`
- `server/settings.toml` — add `[admin]` section
- `server/api/deps.py` — add `check_is_admin` dependency
- `server/api/main.py` — register admin router
- **New:** `server/api/routers/admin.py`

---

## Step 2 — Frontend: Admin layout protection

### 2a. Create `client/app/admin/layout.tsx`

Server component that gates all `/admin/*` routes. Calls the backend to verify admin status — analogous to toocan's `admin/+layout.svelte` with `AuthCheck`. Keeps proxy.ts clean.

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/auth/login');

    const { data: { session } } = await supabase.auth.getSession();
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

    try {
        const res = await fetch(`${apiBase}/admin/is-admin`, {
            headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (!res.ok) redirect('/');
    } catch {
        redirect('/');
    }

    return <>{children}</>;
};

export default AdminLayout;
```

### 2b. Update `client/proxy.ts`

Only change: add `/admin` to the routes that skip the onboarding check (so admin users aren't forced through onboarding). No admin-specific path matching or API calls in proxy.

**Files:**
- **New:** `client/app/admin/layout.tsx`
- `client/proxy.ts` — minor tweak to onboarding skip list

---

## Step 3 — Frontend: Add Marcellus font globally

Update `client/app/layout.tsx`:

```typescript
import { Baloo_2, Nunito, Marcellus } from 'next/font/google';

const marcellus = Marcellus({ weight: '400', subsets: ['latin'], variable: '--font-marcellus' });
```

Add `${marcellus.variable}` to body className.

**Files:**
- `client/app/layout.tsx`

---

## Step 4 — Frontend: Design page + global tokens

### 4a. Create `client/app/admin/design/page.tsx`

Copy from `temp/design_v11/app/page.tsx` (983 lines, self-contained "use client" component, only imports React + lucide-react).

### 4b. Replace `client/app/globals.css` with enchanted forest tokens

Replace current tokens with `temp/design_v11/app/globals.css`:
- Forest palette (light + dark mode)
- `@theme inline` block for Tailwind color/radius/font mappings
- `--font-display` for Marcellus, `--font-sans` for Nunito

**Files:**
- **New:** `client/app/admin/design/page.tsx`
- `client/app/globals.css` — full replacement with forest tokens

---

## Step 5 — Config

No env var needed — admin emails live directly in `server/settings.toml` as a native TOML array. Adding/removing an admin = editing that file and restarting the server.

---

## Verification

1. `cd server && ruff check && ruff format && pytest`
2. `cd client && pnpm github-checks`
3. Manual test via `docker compose up -d`:
   - `/admin/design` as admin email → renders design page
   - `/admin/design` as non-admin → redirects to `/`
   - `/admin/design` logged out → redirects to `/auth/login`

---

## Decisions made

- **Admin config**: Native TOML array in `settings.toml`, no env var or custom validators needed
- **Route protection**: `admin/layout.tsx` server component calls backend `GET /admin/is-admin` (toocan pattern — backend is sole authority, proxy stays clean)
- **Backend protection**: `check_is_admin` dependency on `/admin` API router (protects all admin endpoints)
- **Marcellus font**: Added to root layout globally
- **Design tokens**: Applied globally now (redesign is imminent)
