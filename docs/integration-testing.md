# Integration Testing

Manual and automated integration tests for the app. Agents should run these after implementing new features and add new test cases as features are added.

## Prerequisites

- `supabase start` + `docker compose up -d`
- App: `http://127.0.0.1:3000`
- Mailpit (email): `http://127.0.0.1:54324`
- Supabase API: `http://127.0.0.1:54321`

## Tools

### playwright-cli (browser automation)

Use the `playwright-cli` skill. Key commands:

```bash
playwright-cli open http://127.0.0.1:3000   # open headless browser
playwright-cli snapshot                       # get page element refs (YAML)
playwright-cli fill e25 "value"              # fill input by ref
playwright-cli click e37                      # click by ref
playwright-cli goto http://...               # navigate
playwright-cli screenshot                     # visual screenshot
playwright-cli close                          # close browser
```

Workflow: `open` → `snapshot` → read YAML for refs → `fill`/`click` → `snapshot` to verify.

### Mailpit API (local email)

The Supabase "inbucket" container runs **Mailpit** (not Inbucket).

```bash
# List messages
curl -s "http://127.0.0.1:54324/api/v1/messages"

# Get message by ID
curl -s "http://127.0.0.1:54324/api/v1/message/{ID}"

# Extract OTP from latest email
curl -s "http://127.0.0.1:54324/api/v1/messages" | python3 -c "
import sys, json, re, urllib.request
data = json.load(sys.stdin)
msgs = data.get('messages', data) if isinstance(data, dict) else data
latest_id = msgs[-1]['ID']
resp = urllib.request.urlopen(f'http://127.0.0.1:54324/api/v1/message/{latest_id}')
msg = json.loads(resp.read())
text = msg.get('Text','')
codes = re.findall(r'\b(\d{6})\b', text)
print('OTP:', codes[-1] if codes else 'NOT FOUND')
"
```

**Rate limit**: `email_sent = 2` per hour (`supabase/config.toml`). Supabase returns 200 even when rate-limited — always check Mailpit timestamps to confirm a new email arrived.

### Debug logs

```bash
docker logs supabase_auth_readme --tail=50 2>&1   # Supabase auth
docker logs readme-dev-client-1 --tail=50 2>&1      # Next.js client
```

---

## Test Cases

### 1. Login (email/password)

1. `playwright-cli open http://127.0.0.1:3000` → should redirect to `/auth/login`
2. Fill email + password, click "Sign in"
3. Verify redirect to `/h/<household_id>`
4. Verify home page shows kids and books

### 2. Sign out

1. From home page, click "Settings"
2. Click "Sign out"
3. Verify redirect to `/auth/login`

### 3. Route protection

1. While logged out, `goto http://127.0.0.1:3000/h/some-id`
2. Verify redirect to `/auth/login`

### 4. Password reset — OTP flow

1. Go to `/auth/forgot-password`
2. Enter email, click "Send reset link"
3. Fetch OTP from Mailpit API (check timestamp is fresh!)
4. Enter 6-digit code, click "Verify code"
5. Verify redirect to `/auth/reset-password`
6. Enter new password, confirm, submit
7. Verify redirect to `/auth/login`
8. Log in with new password

### 5. Password reset — email link flow

1. Go to `/auth/forgot-password`, submit email
2. Get email link from Mailpit (`http://127.0.0.1:54321/auth/v1/verify?token=...`)
3. `goto` the link in the browser
4. Verify redirect through `/auth/confirm` → `/auth/reset-password`

### 6. Book upload

1. Log in, navigate to dashboard
2. Upload a PDF via the upload zone
3. Verify book appears in library with "processing" status

### 7. Kid management

1. From dashboard, click "Add" kid
2. Enter name, pick color, submit
3. Verify kid appears in readers list
4. Click edit on a kid, change name, save
5. Verify name updated
6. Delete a kid, verify removed

### 8. Voice session (requires mic — use `--extension` mode)

1. From home page, click on a kid card
2. Select a book, start call
3. Verify Pipecat connects (check bot logs for `UserStartedSpeaking`)

---

## Adding new tests

When implementing a new feature, add a numbered test case to this file covering:
- The happy path
- Any auth/ownership requirements
- What to verify (URL, page content, API response)
