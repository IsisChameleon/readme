# Mic-Off-First Call with Permission Grace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let kids hear Ember speak even before they grant microphone permission, so the bot can coach them through enabling it. When permission changes at any time (before, during, after first bot utterance), the mic hot-attaches/detaches without tearing down the session.

**Architecture:** Connect to Pipecat with `enableMic: false` and attach an `onDeviceError` callback that swallows `permissions` errors so a denied mic cannot abort the session (pattern from toocan: `~/src/toocan-app/client/src/lib/components/call/state/items/pipecat-context.svelte.ts:211-218`). A small React hook (`useMicrophone`) tracks permission state via the browser Permissions API + `onchange`, and after the bot's first utterance auto-triggers `getUserMedia` if state is still `prompt`. On grant, the hook calls `client.enableMic(true)` to hot-attach the track. Surface the `denied` / `unsupported` cases with voice-ui-kit's `ErrorCard` (plus a retry button) positioned as an overlay on the call page. Forward `mic_permission_denied: boolean` to the `/start` POST body so the bot's opening line can adapt (pattern from toocan: `call-controller.svelte.ts:97`).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript. Client libs: `@pipecat-ai/voice-ui-kit` (`ErrorCard`, `Card`), `@pipecat-ai/client-react` (`usePipecatClient`, `useRTVIClientEvent`), `@pipecat-ai/client-js` (`RTVIEvent`). `pnpm` inside `client/`. Vitest + RTL for hook tests.

**Kit-first rule:** any UI primitive we need (card, icon, error surface, spinner) comes from `@pipecat-ai/voice-ui-kit`. The only hand-rolled piece is `useMicrophone` (permission state machine — kit has nothing for this) and a thin `MicPermissionBanner` wrapper around `ErrorCard`.

**Reference implementations in toocan (`~/src/toocan-app`):**
- Permission state machine — `client/src/lib/components/call/state/items/microphone.svelte.ts:106-268`
- `enableMic: false` + swallowed device errors — `.../pipecat-context.svelte.ts:57, 86-89, 211-218`
- `mic_permission_denied` in start payload — `client/src/lib/components/call/call-controller.svelte.ts:97`

**Prerequisite:** `2026-04-15-call-single-click-autoconnect.md` merged first. This plan adds on top of its `canAutoConnect` plumbing and kit-driven bottom controls.

**Out of scope:**
- Dropping `PipecatAppBase` in favour of a direct `PipecatClient` singleton (toocan's approach). Nice-to-have; not needed for this feature.
- Bot-side handling of `mic_permission_denied` — file a backend ticket, but ship the client independently.
- Speaker-device-switching UX — separate ticket.

---

## File Structure

- **Create:** `client/hooks/useMicrophone.ts` — permission state machine + hot-enable-mic effect. ~120 LOC.
- **Create:** `client/hooks/__tests__/useMicrophone.test.tsx` — Vitest tests for the hook.
- **Create:** `client/components/MicPermissionBanner.tsx` — thin wrapper around voice-ui-kit `ErrorCard` with kid-friendly copy + retry. ~50 LOC.
- **Modify:** `client/app/h/[householdId]/reader/[readerId]/call/page.tsx` — add `enableMic: false`, `onDeviceError` swallow, `mic_permission_denied` body field, initial-permission probe in `CallPageInner`, mount `MicPermissionBanner` + `useMicrophone` inside `SessionInner`.

No modifications to global CSS, auth, layout, or backend.

---

## Critical context (read before coding)

1. **Before touching the hook**, open and re-read:
   - `~/src/toocan-app/client/src/lib/components/call/state/items/microphone.svelte.ts` — especially lines 106-133 (permission classification), 158-168 (`onchange`), 209-223 (hot-enable after connect), 253-268 (prompt-after-greeting).
   - `~/src/toocan-app/client/src/lib/components/call/state/items/pipecat-context.svelte.ts` — lines 86-89 (`enableMic: false` constructor), 211-218 (device error with `type === 'permissions'` is swallowed, not set as fatal).
2. **Pipecat React APIs** (from `@pipecat-ai/client-react`):
   - `usePipecatClient()` → returns the `PipecatClient | null`. Has `.enableMic(bool)`.
   - `useRTVIClientEvent(event, cb)` → subscribe imperatively within React lifecycle.
   - `RTVIEvent` enum from `@pipecat-ai/client-js`. You need `RTVIEvent.BotStoppedSpeaking` and possibly `RTVIEvent.BotStartedSpeaking` (to detect the first utterance).
3. **Permissions API quirks:**
   - `navigator.permissions.query({ name: 'microphone' as PermissionName })` — Firefox historically rejected this; handle the rejection and fall back to `'unsupported'`.
   - `PermissionStatus.onchange` fires for address-bar grant/revoke, enabling revoke-mid-call detection without user action.
   - `status.state` values: `'granted' | 'denied' | 'prompt'`. Everything else is `'unsupported'` for our purposes.
4. **SSR guard:** every `navigator.*` access must be inside `useEffect` or guarded by `typeof window !== 'undefined'`. Next 16 will complain at build time otherwise.
5. **`client.enableMic(true)` idempotency:** calling when already enabled is a no-op in Pipecat's SDK. No ref-guard needed, but effect deps should be precise to avoid needless calls.
6. **Body payload field name:** the existing `/start` body uses `kid_id: params.readerId`. When adding `mic_permission_denied`, keep the snake_case convention and spread it after the conditional fields.
7. **Previous plan's state:** Plan 1 introduced `canAutoConnect`. This plan must keep auto-connect gated on `initialMicDenied !== undefined` AND auth token, to prevent a race where `/start` posts before we know whether to include `mic_permission_denied`.

---

## Task 1: Create `useMicrophone` hook

**Files:**
- Create: `client/hooks/useMicrophone.ts`

### - [ ] Step 1.1: Scaffold imports and types

```ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePipecatClient, useRTVIClientEvent } from '@pipecat-ai/client-react';
import { RTVIEvent } from '@pipecat-ai/client-js';
import { usePipecatConnectionState } from '@pipecat-ai/voice-ui-kit';

export type MicPermission = 'granted' | 'prompt' | 'denied' | 'unsupported';

export interface UseMicrophoneResult {
  permission: MicPermission;
  isInitializing: boolean;
  requestAccess: () => Promise<void>;
}
```

### - [ ] Step 1.2: Write the permission query + `onchange` subscription

```ts
export const useMicrophone = (): UseMicrophoneResult => {
  const client = usePipecatClient();
  const { state: connectionState } = usePipecatConnectionState();
  const [permission, setPermission] = useState<MicPermission>('prompt');
  const [isInitializing, setIsInitializing] = useState(true);
  const promptedAfterGreetingRef = useRef(false);
  const botHasSpokenRef = useRef(false);

  const mapState = (s: PermissionState): MicPermission =>
    s === 'granted' ? 'granted' : s === 'denied' ? 'denied' : 'prompt';

  useEffect(() => {
    let cancelled = false;
    let status: PermissionStatus | null = null;

    const run = async () => {
      if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
        if (!cancelled) {
          setPermission('unsupported');
          setIsInitializing(false);
        }
        return;
      }
      try {
        status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      } catch {
        if (!cancelled) {
          setPermission('unsupported');
          setIsInitializing(false);
        }
        return;
      }
      if (cancelled) return;
      setPermission(mapState(status.state));
      setIsInitializing(false);
      status.onchange = () => {
        if (!status) return;
        setPermission(mapState(status.state));
      };
    };

    void run();
    return () => {
      cancelled = true;
      if (status) status.onchange = null;
    };
  }, []);
```

### - [ ] Step 1.3: User-initiated `requestAccess`

```ts
  const requestAccess = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release immediately — PipecatClient owns the active track.
      stream.getTracks().forEach((t) => t.stop());
      setPermission('granted');
    } catch (err) {
      const name = (err as DOMException | undefined)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setPermission('denied');
      }
      // NotFoundError / hardware errors → leave at current state so the user can retry.
    }
  }, []);
```

### - [ ] Step 1.4: Hot-enable Pipecat mic when connected + granted

```ts
  useEffect(() => {
    if (permission !== 'granted') return;
    if (connectionState !== 'connected') return;
    if (!client) return;
    void client.enableMic(true);
  }, [permission, connectionState, client]);
```

### - [ ] Step 1.5: Prompt-after-greeting effect

```ts
  useRTVIClientEvent(
    RTVIEvent.BotStoppedSpeaking,
    useCallback(() => {
      botHasSpokenRef.current = true;
    }, []),
  );

  useEffect(() => {
    if (promptedAfterGreetingRef.current) return;
    if (!botHasSpokenRef.current) return;
    if (permission !== 'prompt') return;
    if (connectionState !== 'connected') return;
    promptedAfterGreetingRef.current = true;
    void requestAccess();
  }, [permission, connectionState, requestAccess]);

  return { permission, isInitializing, requestAccess };
};
```

**Caveat on `botHasSpokenRef`:** the effect above won't re-run purely because a ref changed. That's OK — it re-runs when `permission` or `connectionState` change, which is the normal cadence. The ref just records that the bot finished speaking at some earlier moment; the effect checks it on the next render.

### - [ ] Step 1.6: Static checks

```bash
cd client && pnpm typecheck && pnpm lint
```

### - [ ] Step 1.7: Commit

```bash
git add client/hooks/useMicrophone.ts
git commit -m "feat(call): add useMicrophone permission hook"
```

---

## Task 2: Vitest tests for `useMicrophone`

**Files:**
- Create: `client/hooks/__tests__/useMicrophone.test.tsx`

### - [ ] Step 2.1: Scaffold the test file with mocks

The hook reads: `navigator.permissions.query`, `navigator.mediaDevices.getUserMedia`, Pipecat `usePipecatClient`, `useRTVIClientEvent`, `usePipecatConnectionState`. Mock all of them. The Pipecat React mocks need to expose the event callback so we can manually invoke it in tests.

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

let rtviCallback: (() => void) | null = null;
const enableMic = vi.fn();
let connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

vi.mock('@pipecat-ai/client-react', () => ({
  usePipecatClient: () => ({ enableMic }),
  useRTVIClientEvent: (_evt: unknown, cb: () => void) => {
    rtviCallback = cb;
  },
}));

vi.mock('@pipecat-ai/client-js', () => ({
  RTVIEvent: { BotStoppedSpeaking: 'BotStoppedSpeaking' },
}));

vi.mock('@pipecat-ai/voice-ui-kit', () => ({
  usePipecatConnectionState: () => ({ state: connectionState }),
}));

import { useMicrophone } from '../useMicrophone';

type FakeStatus = { state: PermissionState; onchange: (() => void) | null };

const makeStatus = (state: PermissionState): FakeStatus => ({ state, onchange: null });

const installPermissions = (status: FakeStatus | null, rejects = false) => {
  const query = rejects
    ? vi.fn().mockRejectedValue(new Error('unsupported'))
    : vi.fn().mockResolvedValue(status);
  Object.defineProperty(globalThis.navigator, 'permissions', {
    configurable: true,
    value: status === null && !rejects ? undefined : { query },
  });
};

const installMediaDevices = (impl: () => Promise<MediaStream>) => {
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: impl },
  });
};

const fakeStream = (): MediaStream =>
  ({ getTracks: () => [{ stop: vi.fn() } as unknown as MediaStreamTrack] } as MediaStream);

beforeEach(() => {
  rtviCallback = null;
  enableMic.mockClear();
  connectionState = 'disconnected';
});

afterEach(() => {
  // @ts-expect-error — cleanup
  delete globalThis.navigator.permissions;
  // @ts-expect-error — cleanup
  delete globalThis.navigator.mediaDevices;
});
```

### - [ ] Step 2.2: Initial permission cases

```tsx
describe('useMicrophone initial permission', () => {
  it('reports granted when Permissions API says granted', async () => {
    installPermissions(makeStatus('granted'));
    const { result } = renderHook(() => useMicrophone());
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.permission).toBe('granted');
  });

  it('reports denied', async () => {
    installPermissions(makeStatus('denied'));
    const { result } = renderHook(() => useMicrophone());
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.permission).toBe('denied');
  });

  it('reports prompt', async () => {
    installPermissions(makeStatus('prompt'));
    const { result } = renderHook(() => useMicrophone());
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.permission).toBe('prompt');
  });

  it('reports unsupported when query rejects', async () => {
    installPermissions(null, true);
    const { result } = renderHook(() => useMicrophone());
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.permission).toBe('unsupported');
  });

  it('reports unsupported when Permissions API missing', async () => {
    installPermissions(null);
    const { result } = renderHook(() => useMicrophone());
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.permission).toBe('unsupported');
  });
});
```

### - [ ] Step 2.3: `onchange` picks up address-bar grant

```tsx
describe('useMicrophone onchange', () => {
  it('updates permission when status.onchange fires', async () => {
    const status = makeStatus('denied');
    installPermissions(status);
    const { result } = renderHook(() => useMicrophone());
    await waitFor(() => expect(result.current.permission).toBe('denied'));

    act(() => {
      status.state = 'granted';
      status.onchange?.();
    });

    await waitFor(() => expect(result.current.permission).toBe('granted'));
  });
});
```

### - [ ] Step 2.4: `enableMic(true)` fires when granted + connected

```tsx
describe('useMicrophone hot-enable', () => {
  it('calls client.enableMic(true) once granted + connected', async () => {
    const status = makeStatus('granted');
    installPermissions(status);
    connectionState = 'connected';
    renderHook(() => useMicrophone());
    await waitFor(() => expect(enableMic).toHaveBeenCalledWith(true));
  });

  it('does not call enableMic while still connecting', async () => {
    installPermissions(makeStatus('granted'));
    connectionState = 'connecting';
    renderHook(() => useMicrophone());
    await waitFor(() => {
      expect(enableMic).not.toHaveBeenCalled();
    });
  });
});
```

### - [ ] Step 2.5: `requestAccess` success + denial

```tsx
describe('useMicrophone requestAccess', () => {
  it('sets granted on success', async () => {
    installPermissions(makeStatus('prompt'));
    installMediaDevices(() => Promise.resolve(fakeStream()));
    const { result } = renderHook(() => useMicrophone());
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    await act(async () => {
      await result.current.requestAccess();
    });

    expect(result.current.permission).toBe('granted');
  });

  it('sets denied on NotAllowedError', async () => {
    installPermissions(makeStatus('prompt'));
    installMediaDevices(() => {
      const e = new Error('denied');
      (e as { name?: string }).name = 'NotAllowedError';
      return Promise.reject(e);
    });
    const { result } = renderHook(() => useMicrophone());
    await waitFor(() => expect(result.current.isInitializing).toBe(false));

    await act(async () => {
      await result.current.requestAccess();
    });

    expect(result.current.permission).toBe('denied');
  });
});
```

### - [ ] Step 2.6: Run + commit

```bash
cd client && pnpm test -- useMicrophone
```

Expected: all green. If a test hangs on `waitFor`, verify the mock for `navigator.permissions` is re-installed per test (the `beforeEach` / `afterEach` cycle is the fix).

```bash
cd client && pnpm github-checks
git add client/hooks/useMicrophone.ts client/hooks/__tests__/useMicrophone.test.tsx
git commit -m "test(call): useMicrophone permission hook"
```

---

## Task 3: Create `MicPermissionBanner` (voice-ui-kit `ErrorCard` wrapper)

**Files:**
- Create: `client/components/MicPermissionBanner.tsx`

### - [ ] Step 3.1: Verify `ErrorCard` is available

Open `client/node_modules/@pipecat-ai/voice-ui-kit/dist/index.d.ts` and search for `ErrorCard`. Confirm its prop shape: `title?`, `noHeader?`, `classNames?`, `icon?`, `children?` plus card props (size, shadow, rounded). If the installed version doesn't export `ErrorCard`, fall back to `Card` + header. Do **not** hand-roll a card div.

### - [ ] Step 3.2: Implement the component

```tsx
'use client';

import { MicOff, Mic } from 'lucide-react';
import { ErrorCard } from '@pipecat-ai/voice-ui-kit';
import type { MicPermission } from '@/hooks/useMicrophone';

interface Props {
  permission: MicPermission;
  onRetry: () => void;
}

export const MicPermissionBanner = ({ permission, onRetry }: Props) => {
  if (permission === 'granted' || permission === 'prompt') return null;

  const isDenied = permission === 'denied';
  const title = isDenied ? 'Ember can’t hear you yet' : 'No microphone found';
  const Icon = isDenied ? MicOff : Mic;

  return (
    <div
      style={{
        position: 'absolute',
        top: 64,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 15,
        maxWidth: 380,
        width: 'calc(100% - 32px)',
      }}
    >
      <ErrorCard
        title={title}
        icon={<Icon size={20} />}
      >
        <p style={{ margin: 0, lineHeight: 1.4, fontFamily: 'var(--font-nunito)' }}>
          {isDenied
            ? 'Tap the 🎤 at the top of your screen, choose Allow, then press Try again.'
            : 'We can’t find a microphone on this device. You can still listen to Ember.'}
        </p>
        {isDenied && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              marginTop: 10,
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid currentColor',
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            Try again
          </button>
        )}
      </ErrorCard>
    </div>
  );
};
```

### - [ ] Step 3.3: Static checks + commit

```bash
cd client && pnpm typecheck && pnpm lint
git add client/components/MicPermissionBanner.tsx
git commit -m "feat(call): add MicPermissionBanner using kit ErrorCard"
```

---

## Task 4: Wire into the call page

**Files:**
- Modify: `client/app/h/[householdId]/reader/[readerId]/call/page.tsx`

### - [ ] Step 4.1: Set `enableMic: false` and swallow permission-type device errors

Update `clientOptions` on `PipecatAppBase` (currently around lines 190–199). This mirrors toocan's `pipecat-context.svelte.ts:211-218`:

```tsx
clientOptions={{
  enableMic: false,
  callbacks: {
    onServerMessage: (data: unknown) => {
      const msg = data as Record<string, unknown> | null;
      if (msg?.type === 'UserVerballyInitiatedDisconnect') {
        handleDisconnectRef.current?.();
      }
    },
    onDeviceError: (err: unknown) => {
      const error = err as { type?: string; message?: string } | undefined;
      if (error?.type === 'permissions') {
        console.warn('[call] device permission error — continuing without mic:', error?.message);
        return; // DO NOT throw, DO NOT disconnect
      }
      console.error('[call] device error:', error);
    },
  },
}}
```

If the installed `@pipecat-ai/client-js` version types the `onDeviceError` arg more precisely, use that type. Do not cast to `any`.

### - [ ] Step 4.2: Probe initial mic permission before auto-connect

At the top of `CallPageInner` (after the existing `useState`s), add:

```tsx
const [initialMicDenied, setInitialMicDenied] = useState<boolean | undefined>(undefined);

useEffect(() => {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    setInitialMicDenied(false);
    return;
  }
  navigator.permissions
    .query({ name: 'microphone' as PermissionName })
    .then((status) => setInitialMicDenied(status.state === 'denied'))
    .catch(() => setInitialMicDenied(false));
}, []);
```

### - [ ] Step 4.3: Tighten `canAutoConnect`

Find the `canAutoConnect` useMemo (introduced in plan 1). Update:

```tsx
const canAutoConnect = useMemo(() => {
  if (initialMicDenied === undefined) return false; // wait for probe
  const pipecatKey = process.env.NEXT_PUBLIC_PIPECAT_PUBLIC_KEY;
  return Boolean(pipecatKey) || Boolean(authToken);
}, [authToken, initialMicDenied]);
```

### - [ ] Step 4.4: Add `mic_permission_denied` to `/start` body

Update the `startBotParams.requestData.body`:

```tsx
body: {
  ...(bookId ? { book_id: bookId } : {}),
  ...(params.readerId ? { kid_id: params.readerId } : {}),
  mic_permission_denied: Boolean(initialMicDenied),
},
```

### - [ ] Step 4.5: Use `useMicrophone` + banner inside `SessionInner`

Both hooks (`useMicrophone` relies on `usePipecatClient`) must run inside `PipecatAppBase`'s provider tree. `SessionInner` is inside it — perfect location.

Add imports at the top of `page.tsx`:

```tsx
import { useMicrophone } from '@/hooks/useMicrophone';
import { MicPermissionBanner } from '@/components/MicPermissionBanner';
```

Inside `SessionInner` (after the existing hook calls around line 50):

```tsx
const { permission, requestAccess } = useMicrophone();
```

Mount the banner as the first absolute-positioned child of the root `<div className="voice-session-bg" ...>`, immediately after the top bar:

```tsx
<MicPermissionBanner permission={permission} onRetry={requestAccess} />
```

### - [ ] Step 4.6: Static checks + commit

```bash
cd client && pnpm github-checks
git add client/app/h/[householdId]/reader/[readerId]/call/page.tsx
git commit -m "feat(call): mic-off-first with permission grace UI"
```

---

## Task 5: Manual browser verification

### - [ ] Step 5.1: Restart the stack

```bash
docker compose up -d
docker compose logs client --tail=20
docker compose logs bot --tail=20
```

### - [ ] Step 5.2: First-time user (`prompt`)

Use a fresh browser profile (or revoke mic for the site in settings). Sign in.
1. Click Start Reading.
2. **Expected:** the page connects without triggering a mic prompt immediately; bot audio starts when connected.
3. After the bot finishes its first utterance, the browser mic prompt appears automatically.
4. Grant. **Expected:** the prompt dismisses, `client.enableMic(true)` fires, and your speech produces `UserStartedSpeaking` in the bot logs.
5. Screenshot: `prompt-after-greeting.png`.

### - [ ] Step 5.3: Already `granted`

Same flow but permission is already granted from a prior session.
1. **Expected:** connection reaches `connected`, bot speaks, no re-prompt appears, you can speak immediately after the bot's first pause.
2. Banner never appears.

### - [ ] Step 5.4: `denied` from the start

In browser site settings, set Microphone → Block. Reload and click Start Reading.
1. **Expected:** the session connects and the bot speaks; `MicPermissionBanner` is visible (kit `ErrorCard` wrapper); bot opening adapts if backend supports `mic_permission_denied`, otherwise default opening.
2. Grant via the address-bar prompt.
3. **Expected:** `permissions.onchange` fires → `permission === 'granted'` → `client.enableMic(true)` → banner disappears → you can speak.
4. Screenshots: `denied-initial.png`, `denied-granted.png`.

### - [ ] Step 5.5: Revoked mid-call

From `granted + connected`, open site settings and block mic.
1. **Expected:** `permission → 'denied'`; banner reappears; session stays alive; bot keeps talking.

### - [ ] Step 5.6: `unsupported` fallback

Temporarily patch `useMicrophone` to force the unsupported branch (or test in a browser where the mic permission name isn't supported).
1. **Expected:** banner shows the "No microphone found" copy; no crash; connection proceeds.
2. Revert the patch before committing.

### - [ ] Step 5.7: Commit any fixes

```bash
git add -p
git commit -m "fix(call): <concise summary>"
```

---

## Self-review checklist

- [ ] `useMicrophone` uses `usePipecatClient` (not direct `PipecatClient` construction) and stays inside `PipecatAppBase`'s provider tree.
- [ ] `onDeviceError` swallows `type === 'permissions'` errors and does not disconnect (mirrors toocan).
- [ ] `canAutoConnect` waits on both `authToken` and `initialMicDenied`.
- [ ] `mic_permission_denied` is always a boolean in the `/start` body.
- [ ] Banner uses voice-ui-kit `ErrorCard` (or kit `Card` fallback) — not a hand-rolled div.
- [ ] Hook test file runs in isolation (`pnpm test -- useMicrophone` → all green).
- [ ] `pnpm github-checks` green.
- [ ] Playwright verification screenshots attached.

---

## Definition of done

- [ ] Bot audio plays even when mic permission is `prompt` or `denied`.
- [ ] `prompt` state auto-triggers the browser mic prompt after the bot's first utterance — no banner shown.
- [ ] `denied` state shows `MicPermissionBanner`, and address-bar grants hot-attach the mic without disconnecting.
- [ ] Revoke mid-call surfaces the banner; session survives.
- [ ] `pnpm github-checks` green in CI.
- [ ] Playwright screenshots attached.
