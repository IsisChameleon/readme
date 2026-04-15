# Single-Click Call Start (Auto-Connect) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the second ("Connect") click on the call page so clicking "Start Reading" on the reader home boots straight into a live voice session, without introducing a 401 race on the `/start` POST.

**Architecture:** Keep `PipecatAppBase` as the session owner. Inside `SessionInner`, add an auth-gated `useEffect` that fires the render-prop `handleConnect` exactly once — as soon as `authToken` (or `NEXT_PUBLIC_PIPECAT_PUBLIC_KEY`) is available. Lean on voice-ui-kit primitives for visual state: `ConnectButton` already swaps its label and variant per transport state (via its `stateContent` prop), so instead of hand-rolling a "Connecting…" loader, customise its `stateContent` to show kid-friendly copy and hide it entirely during `connecting` so it cannot be re-triggered while a connection is in flight. Drop the legacy `?autoconnect=true` query-param hack.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `@pipecat-ai/voice-ui-kit`, `@pipecat-ai/client-react`. `pnpm` inside `client/`. Test harness: Vitest + RTL (`client/vitest.config.ts`). Dev runtime: `docker compose up -d`.

**Rule for this plan:** prefer kit components over hand-rolled ones. Anything in `@pipecat-ai/voice-ui-kit` — `ConnectButton`, `SpinLoader`, `LED`, `UserAudioControl`, `ErrorCard` — beats a custom equivalent.

**Scope:** Pure frontend, single page. No backend changes. No mic-permission UX (see `2026-04-15-call-mic-permission-grace.md`).

**Out of scope:**
- `enableMic: false` / mic-off-first.
- Pre-warming `/start` on the reader page.

---

## File Structure

- **Modify:** `client/app/h/[householdId]/reader/[readerId]/call/page.tsx` — adds an `authToken`-gated auto-connect effect, tweaks `ConnectButton`'s `stateContent`, hides the button during `connecting`, removes the legacy `?autoconnect=true` effect, plumbs `canAutoConnect` down to `SessionInner`, and adds a `SpinLoader` for the pre-client init window.
- **Create:** `client/app/h/[householdId]/reader/[readerId]/call/__tests__/SessionInner.test.tsx` — a small Vitest+RTL test for the auto-connect gating.

No new UI components are added. All visual state uses kit exports.

---

## Critical context (read before coding)

1. **Current file:** `client/app/h/[householdId]/reader/[readerId]/call/page.tsx`.
   - Lines 40–61: `SessionInner` currently honours `?autoconnect=true`. Delete that effect.
   - Lines 116–122: `<UserAudioControl>` and `<ConnectButton>` are always rendered — become conditional.
   - Lines 128–152: `CallPageInner` fetches `authToken` asynchronously. Bug being fixed: if `handleConnect` fires before `authToken` resolves, `/start` POSTs without `Authorization` → 401.
   - Line 145: `NEXT_PUBLIC_PIPECAT_PUBLIC_KEY`, when set, is used as the bearer. Your gate must treat that env var as "auth ready" even without `authToken`.
2. **Voice-ui-kit pieces you must use:**
   - **`ConnectButton`** (already imported) — reads transport state from context. Accepts `stateContent?: Partial<Record<TransportState, { children: ReactNode; variant: ButtonVariant; className?: string }>>`. Override the `connecting` and `connected` states to Ember copy; keep the default for the rest. `TransportState` comes from `@pipecat-ai/client-js`.
   - **`SpinLoader`** (import from `@pipecat-ai/voice-ui-kit`) — spinner primitive. Use it while `client === null` in the render prop (pre-initialised state).
   - **`LED`** (import from `@pipecat-ai/voice-ui-kit`) — the dot. Replace the hand-rolled `<span>` at line 72 with `<LED on={...} blinking={...} />`. This is a light polish; skip if its classNames don't compose with the current layout.
   - **`ErrorCard`** is not used in *this* PR (mic-permission plan uses it), but don't add your own error UI — if you need an error surface, use `ErrorCard`.
3. **`usePipecatConnectionState`** already destructured at line 50 — reuse it, do not call twice.
4. **`connectOnMount` on `PipecatAppBase` will NOT work here** — it fires before `authToken` resolves, reproducing the 401 race. Stick with the render-prop + manual auto-fire pattern below.
5. **Body payload quirk:** `/start` body still uses `kid_id: params.readerId` (backend field name is historical). Do not rename.
6. **Quality gate:** `pnpm github-checks` runs `eslint && tsc --noEmit && vitest --run`. Must be green at each commit.

---

## Task 1: Plumb `canAutoConnect` and fire the connect effect

**Files:**
- Modify: `client/app/h/[householdId]/reader/[readerId]/call/page.tsx`

### - [ ] Step 1.1: Extend `SessionInner` prop type

Replace the existing props block (lines 40–48):

```tsx
const SessionInner = ({
  handleConnect,
  handleDisconnect,
  visualMode,
  canAutoConnect,
}: {
  handleConnect?: () => void | Promise<void>;
  handleDisconnect?: () => void | Promise<void>;
  visualMode: VisualMode;
  canAutoConnect: boolean;
}) => {
```

### - [ ] Step 1.2: Replace the legacy `?autoconnect=true` effect

Delete the effect currently at lines 56–61 and the `const searchParams = useSearchParams();` at line 53 (it is not used elsewhere in `SessionInner`; `CallPageInner` still has its own import at line 132). Replace with:

```tsx
const autoConnectAttempted = useRef(false);

useEffect(() => {
  if (!canAutoConnect) return;
  if (!handleConnect) return;
  if (autoConnectAttempted.current) return;
  autoConnectAttempted.current = true;
  void handleConnect();
}, [canAutoConnect, handleConnect]);
```

### - [ ] Step 1.3: Compute `canAutoConnect` in `CallPageInner`

After the existing `connectHeaders` useMemo (around line 152), add:

```tsx
const canAutoConnect = useMemo(() => {
  const pipecatKey = process.env.NEXT_PUBLIC_PIPECAT_PUBLIC_KEY;
  return Boolean(pipecatKey) || Boolean(authToken);
}, [authToken]);
```

Pass it in the render-prop child (lines 204–208):

```tsx
<SessionInner
  handleConnect={handleConnect}
  handleDisconnect={handleDisconnect}
  visualMode={visualMode}
  canAutoConnect={canAutoConnect}
/>
```

### - [ ] Step 1.4: Static checks

```bash
cd client && pnpm typecheck && pnpm lint
```

Expected: both pass. If TS flags the `useSearchParams` import as unused in `SessionInner`, remove that line — but the `CallPageInner` usage should keep it present.

### - [ ] Step 1.5: Commit

```bash
git add client/app/h/[householdId]/reader/[readerId]/call/page.tsx
git commit -m "feat(call): auth-gated auto-connect on mount"
```

---

## Task 2: Kit-driven visual state for the bottom controls

**Files:**
- Modify: `client/app/h/[householdId]/reader/[readerId]/call/page.tsx`

### - [ ] Step 2.1: Import the additional kit exports

Update the `@pipecat-ai/voice-ui-kit` import block at the top of the file:

```tsx
import {
  ConnectButton,
  PipecatAppBase,
  SpinLoader,
  TranscriptOverlay,
  UserAudioControl,
  usePipecatConnectionState,
} from '@pipecat-ai/voice-ui-kit';
```

### - [ ] Step 2.2: Add Ember-flavoured `stateContent` for `ConnectButton`

Above the `SessionInner` declaration (alongside `PLASMA_CONFIG` / `STATUS_COLORS`), add:

```tsx
const CONNECT_BUTTON_STATE_CONTENT = {
  disconnected: { children: 'Start reading', variant: 'primary' as const },
  connecting: { children: 'Waking Ember…', variant: 'secondary' as const },
  authenticating: { children: 'Waking Ember…', variant: 'secondary' as const },
  authenticated: { children: 'Waking Ember…', variant: 'secondary' as const },
  connected: { children: 'End reading', variant: 'destructive' as const },
  ready: { children: 'End reading', variant: 'destructive' as const },
};
```

If TypeScript rejects `'primary'` / `'destructive'` because `ButtonVariant` uses different names in the installed version, open `client/node_modules/@pipecat-ai/voice-ui-kit/dist/index.d.ts`, search for `ButtonVariant`, and substitute the closest semantic match (the kit is under active development; variants occasionally rename). Do not cast to `any`; pick real variant strings.

### - [ ] Step 2.3: Conditional bottom-controls block

Replace the bottom-controls row (currently lines 116–122) with:

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', minHeight: 44 }}>
  {connectionState === 'connected' && (
    <UserAudioControl visualizerProps={{ barCount: 5 }} />
  )}
  {connectionState !== 'connecting' && (
    <ConnectButton
      size="lg"
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      stateContent={CONNECT_BUTTON_STATE_CONTENT}
    />
  )}
  {connectionState === 'connecting' && (
    <div
      role="status"
      aria-live="polite"
      style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#CAB8EB', fontFamily: 'var(--font-nunito)' }}
    >
      <SpinLoader />
      <span>Waking Ember…</span>
    </div>
  )}
</div>
```

Notes:
- Hiding `ConnectButton` during `connecting` prevents the user from re-triggering connect mid-flight. `SpinLoader` conveys the wait.
- `UserAudioControl` only appears once connected — before then it has no mic to control.
- On `disconnected` (after a user-initiated end), `ConnectButton` reappears with the `Start reading` label so the user can rejoin. Also reset `autoConnectAttempted.current` when the user-initiated disconnect happens — see step 2.4.

### - [ ] Step 2.4: Reset the auto-connect guard on explicit disconnect

Inside `SessionInner`, wrap the `handleDisconnect` handed to `ConnectButton` so that clicking End Reading allows Reconnect via the same auto-path should the user stay on the page:

```tsx
const onUserDisconnect = useCallback(() => {
  autoConnectAttempted.current = false;
  return handleDisconnect?.();
}, [handleDisconnect]);
```

Add `useCallback` to the `react` import at the top. Use `onUserDisconnect` in the `ConnectButton` `onDisconnect` slot in step 2.3 (replace `onDisconnect={handleDisconnect}` with `onDisconnect={onUserDisconnect}`).

### - [ ] Step 2.5: Show `SpinLoader` while the Pipecat client is initialising

In `CallPageInner`'s render-prop child (currently around line 201), branch on `client`:

```tsx
{({ client, handleConnect, handleDisconnect }) => {
  handleDisconnectRef.current = handleDisconnect;
  if (!client) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100dvh' }}>
        <SpinLoader />
      </div>
    );
  }
  return (
    <SessionInner
      handleConnect={handleConnect}
      handleDisconnect={handleDisconnect}
      visualMode={visualMode}
      canAutoConnect={canAutoConnect}
    />
  );
}}
```

### - [ ] Step 2.6: (Optional polish) Replace the hand-rolled status dot with `LED`

Currently the top-bar dot is a hand-styled `<span>` (line 72). Replace with:

```tsx
<LED on={connectionState === 'connected'} blinking={connectionState === 'connecting'} />
```

And add `LED` to the voice-ui-kit import. If this adds complexity (e.g. the `LED` default colour clashes with the existing palette and you can't override via classNames without adding Tailwind utilities), skip this step — it is optional and bounded to Task 2. The kit-first rule applies, but layout bugs are a worse outcome than reusing the custom span.

### - [ ] Step 2.7: Static checks

```bash
cd client && pnpm typecheck && pnpm lint
```

Expected: pass.

### - [ ] Step 2.8: Commit

```bash
git add client/app/h/[householdId]/reader/[readerId]/call/page.tsx
git commit -m "feat(call): kit-driven connecting/idle/connected controls"
```

---

## Task 3: Vitest smoke test for the auto-connect effect

The test covers the two regressions that matter: (a) connecting before auth is ready, (b) firing connect more than once.

**Files:**
- Create: `client/app/h/[householdId]/reader/[readerId]/call/__tests__/SessionInner.test.tsx`

### - [ ] Step 3.1: Export `SessionInner` from the page module

At its declaration in `page.tsx`, change `const SessionInner = ...` to `export const SessionInner = ...`. Keep `CallPageInner` non-exported and `CallPage` default-exported. Rerun `pnpm typecheck` to catch any accidental shadowing.

### - [ ] Step 3.2: Write the test

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { SessionInner } from '../page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ householdId: 'h1', readerId: 'r1' }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@pipecat-ai/client-react', () => ({
  usePipecatClientMediaTrack: () => null,
}));

vi.mock('@pipecat-ai/voice-ui-kit', () => ({
  ConnectButton: ({ onDisconnect }: { onDisconnect?: () => void }) => (
    <button onClick={onDisconnect}>disconnect</button>
  ),
  SpinLoader: () => <div data-testid="spin" />,
  TranscriptOverlay: () => null,
  UserAudioControl: () => <div data-testid="mic-control" />,
  usePipecatConnectionState: () => ({ state: 'disconnected' }),
  // Not imported by SessionInner itself but safe to stub:
  LED: () => <i data-testid="led" />,
}));

vi.mock('@pipecat-ai/voice-ui-kit/webgl', () => ({
  Plasma: () => null,
}));

vi.mock('@/components/AnimatedOrb', () => ({
  AnimatedOrb: () => <div data-testid="orb" />,
}));

describe('SessionInner auto-connect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fire handleConnect when canAutoConnect is false', () => {
    const handleConnect = vi.fn();
    render(
      <SessionInner
        handleConnect={handleConnect}
        handleDisconnect={vi.fn()}
        visualMode="dragon"
        canAutoConnect={false}
      />
    );
    expect(handleConnect).not.toHaveBeenCalled();
  });

  it('fires handleConnect once when canAutoConnect is true', () => {
    const handleConnect = vi.fn();
    render(
      <SessionInner
        handleConnect={handleConnect}
        handleDisconnect={vi.fn()}
        visualMode="dragon"
        canAutoConnect={true}
      />
    );
    expect(handleConnect).toHaveBeenCalledTimes(1);
  });

  it('does not fire handleConnect again on re-render', () => {
    const handleConnect = vi.fn();
    const { rerender } = render(
      <SessionInner
        handleConnect={handleConnect}
        handleDisconnect={vi.fn()}
        visualMode="dragon"
        canAutoConnect={true}
      />
    );
    rerender(
      <SessionInner
        handleConnect={handleConnect}
        handleDisconnect={vi.fn()}
        visualMode="plasma"
        canAutoConnect={true}
      />
    );
    expect(handleConnect).toHaveBeenCalledTimes(1);
  });

  it('does not fire when canAutoConnect transitions false → true after handleConnect already succeeded once', () => {
    const handleConnect = vi.fn();
    const { rerender } = render(
      <SessionInner
        handleConnect={handleConnect}
        handleDisconnect={vi.fn()}
        visualMode="dragon"
        canAutoConnect={false}
      />
    );
    rerender(
      <SessionInner
        handleConnect={handleConnect}
        handleDisconnect={vi.fn()}
        visualMode="dragon"
        canAutoConnect={true}
      />
    );
    expect(handleConnect).toHaveBeenCalledTimes(1);
  });
});
```

### - [ ] Step 3.3: Run just this test file

```bash
cd client && pnpm test -- SessionInner
```

Expected: 4 passing. If a mock is missing an export your component actually imports, add it to the mock object (keep minimal).

### - [ ] Step 3.4: Run the full gate

```bash
cd client && pnpm github-checks
```

Expected: green.

### - [ ] Step 3.5: Commit

```bash
git add client/app/h/[householdId]/reader/[readerId]/call/__tests__/SessionInner.test.tsx client/app/h/[householdId]/reader/[readerId]/call/page.tsx
git commit -m "test(call): auto-connect gating and one-shot behaviour"
```

---

## Task 4: Manual browser verification

### - [ ] Step 4.1: Restart the stack

```bash
docker compose up -d
docker compose logs client --tail=20
docker compose logs bot --tail=20
```

Expected: client compiles cleanly; bot is up.

### - [ ] Step 4.2: Golden path (granted mic)

Using the `playwright-cli` skill in extension mode:
1. Sign in with a test account.
2. Navigate to a reader home with at least one book.
3. Click the "Start Reading" CTA.
4. **Expected within ~3s:** URL `/h/.../reader/.../call?bookId=<id>`; status pill goes `disconnected → connecting → connected`; kit `SpinLoader` + "Waking Ember…" caption during `connecting`; `UserAudioControl` + `ConnectButton` (label: "End reading") appear once `connected`; bot audio plays.
5. Speak one sentence. `docker compose logs bot --tail=50` should show `UserStartedSpeaking`.
6. Screenshots: `connecting.png`, `connected.png`.

### - [ ] Step 4.3: Edge — slow auth token

1. DevTools → Network → "Slow 3G".
2. Hard-reload the call URL directly.
3. **Expected:** page stays `disconnected` while `getAccessToken` is pending, then transitions normally; bot logs show no 401.

### - [ ] Step 4.4: Edge — back button during connect

1. Click Start Reading; during the loader, click X.
2. **Expected:** navigation leaves the page; bot logs show at most a brief join/leave pair.

### - [ ] Step 4.5: Edge — end-and-reconnect

1. From `connected`, click the kit `ConnectButton` (label "End reading").
2. **Expected:** pill → `disconnected`; the button relabels to "Start reading".
3. Click it. **Expected:** connects again without a page reload.

### - [ ] Step 4.6: If fixes were needed, commit

```bash
git add -p
git commit -m "fix(call): <concise summary>"
```

---

## Self-review checklist

Before PR:
- [ ] Every kit import you used (`ConnectButton`, `SpinLoader`, etc.) resolves — no `any` casts to work around a missing prop.
- [ ] No hand-rolled spinner, no custom CSS keyframe, no custom button-variant component.
- [ ] `?autoconnect=true` grepped — should match nothing.
- [ ] `canAutoConnect` is true when only `NEXT_PUBLIC_PIPECAT_PUBLIC_KEY` is set.
- [ ] `autoConnectAttempted` resets on user-initiated disconnect (`onUserDisconnect`).
- [ ] `pnpm github-checks` exits 0.
- [ ] Manual playwright screenshots attached to the PR.

---

## Definition of done

- [ ] Clicking "Start Reading" puts the user into an audible session within ~3s, zero second click.
- [ ] Auth-token race cannot produce an unauthenticated `/start` POST.
- [ ] All bottom-row state changes are rendered via voice-ui-kit primitives.
- [ ] `pnpm github-checks` green in CI.
- [ ] Manual verification screenshots attached.
