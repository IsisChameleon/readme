'use client';

/**
 * DailyTransport : See https://github.com/pipecat-ai/pipecat-client-web-transports/blob/main/transports/daily/src/transport.ts
 * PipecatClient : See https://github.com/pipecat-ai/pipecat-client-web/blob/main/client-js/client/client.ts
 * PipecatAppBase: See https://github.com/pipecat-ai/voice-ui-kit/blob/main/package/src/components/PipecatAppBase.tsx
 *  **/

import { Suspense, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { X } from 'lucide-react';
import { usePipecatClientMediaTrack } from '@pipecat-ai/client-react';
import {
  ConnectButton,
  PipecatAppBase,
  SpinLoader,
  TranscriptOverlay,
  UserAudioControl,
  usePipecatConnectionState,
} from '@pipecat-ai/voice-ui-kit';
import { Plasma } from '@pipecat-ai/voice-ui-kit/webgl';
import '@pipecat-ai/voice-ui-kit/styles.scoped';
import { useTheme } from '@/components/ThemeProvider';

const PLASMA_LIGHT = {
  color1: '#2D6A4F', // --primary (light)
  color2: '#E9A55F', // --accent (light)
  color3: '#7C6DAF', // --magic (light)
  backgroundColor: '#F5F7F2', // --background (light)
};

const PLASMA_DARK = {
  color1: '#40916C', // --primary (dark)
  color2: '#E9A55F', // --accent (dark)
  color3: '#9B8EC4', // --magic-light (dark)
  backgroundColor: '#141F1A', // --background (dark)
};

const STATUS_COLORS: Record<string, string> = {
  connected: 'var(--primary)',
  connecting: 'var(--magic)',
  disconnected: 'var(--destructive)',
};

const CONNECT_BUTTON_STATE_CONTENT = {
  initializing: { children: 'Start reading', variant: 'primary' as const },
  initialized: { children: 'Start reading', variant: 'primary' as const },
  disconnected: { children: 'Start reading', variant: 'primary' as const },
  disconnecting: { children: 'Ending…', variant: 'secondary' as const },
  connecting: { children: 'Waking Ember…', variant: 'secondary' as const },
  authenticating: { children: 'Waking Ember…', variant: 'secondary' as const },
  authenticated: { children: 'Waking Ember…', variant: 'secondary' as const },
  connected: { children: 'End reading', variant: 'destructive' as const },
  ready: { children: 'End reading', variant: 'destructive' as const },
};

export const SessionInner = ({
  handleConnect,
  handleDisconnect,
}: {
  handleConnect?: () => void | Promise<void>;
  handleDisconnect?: () => void | Promise<void>;
}) => {
  const remoteAudioTrack = usePipecatClientMediaTrack('audio', 'bot');
  const { state: connectionState } = usePipecatConnectionState();
  const router = useRouter();
  const params = useParams<{ householdId: string; readerId: string }>();
  const { theme } = useTheme();

  const onUserDisconnect = useCallback(() => {
    return handleDisconnect?.();
  }, [handleDisconnect]);

  const handleBack = () => {
    router.push(`/h/${params.householdId}/reader/${params.readerId}`);
  };

  const plasmaConfig = useMemo(() => {
    const palette = theme === 'dark' ? PLASMA_DARK : PLASMA_LIGHT;
    return {
      useCustomColors: true,
      ...palette,
      intensity: 1.2,
      radius: 1.0,
      ringCount: 4,
      audioEnabled: true,
      audioSensitivity: 1.5,
    };
  }, [theme]);

  return (
    <div className="bg-background text-foreground" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100dvh', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[connectionState] ?? 'var(--destructive)' }} />
          <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-nunito)' }}>
            {connectionState}
          </span>
        </div>
        <button
          onClick={handleBack}
          aria-label="End session"
          className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Visual area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <Plasma
          key={theme}
          width={600}
          height={600}
          initialConfig={plasmaConfig}
          audioTrack={remoteAudioTrack ?? undefined}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Bottom controls */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 24px', gap: '8px' }}>
        <TranscriptOverlay
          participant="local"
          size="sm"
          fadeInDuration={200}
          fadeOutDuration={800}
          className="text-center opacity-60"
        />
        <TranscriptOverlay
          participant="remote"
          size="lg"
          fadeInDuration={300}
          fadeOutDuration={1500}
          className="text-center"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', minHeight: 44 }}>
          <UserAudioControl visualizerProps={{ barCount: 5 }} />
          {connectionState !== 'connecting' && (
            <ConnectButton
              size="lg"
              onConnect={handleConnect}
              onDisconnect={onUserDisconnect}
              stateContent={CONNECT_BUTTON_STATE_CONTENT}
            />
          )}
          {connectionState === 'connecting' && (
            <div
              role="status"
              aria-live="polite"
              style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--magic)', fontFamily: 'var(--font-nunito)' }}
            >
              <SpinLoader />
              <span>Waking Ember…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CallPageInner = () => {
  const handleDisconnectRef = useRef<(() => void | Promise<void>) | undefined>(undefined);
  const searchParams = useSearchParams();
  const bookId = searchParams.get('bookId');
  const params = useParams<{ readerId: string }>();
  const { theme } = useTheme();

  const connectEndpoint =
    process.env.NEXT_PUBLIC_CONNECT_ENDPOINT || 'http://localhost:7860/start';

  const pipecatKey = process.env.NEXT_PUBLIC_PIPECAT_PUBLIC_KEY;
  const connectHeaders = useMemo(() => {
    const h = new Headers();
    if (pipecatKey) h.set('Authorization', `Bearer ${pipecatKey}`);
    return h;
  }, [pipecatKey]);

  return (
    <div className="vkui-root voice-ui-kit bg-background" style={{ width: '100%', height: '100dvh' }}>
      <PipecatAppBase
        transportType="daily"
        startBotParams={{
          endpoint: connectEndpoint,
          headers: connectHeaders,
          requestData: {
            createDailyRoom: true,
            body: {
              ...(bookId ? { book_id: bookId } : {}),
              ...(params.readerId ? { kid_id: params.readerId } : {}),
            },
          },
        }}
        initDevicesOnMount
        connectOnMount
        themeProps={{ defaultTheme: theme }}
        clientOptions={{
          callbacks: {
            onServerMessage: (data: unknown) => {
              const msg = data as Record<string, unknown> | null;
              if (msg?.type === 'UserVerballyInitiatedDisconnect') {
                handleDisconnectRef.current?.();
              }
            },
          },
        }}
      >
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
            />
          );
        }}
      </PipecatAppBase>
    </div>
  );
};

export default function CallPage() {
  return (
    <Suspense fallback={<div className="bg-background" style={{ width: '100%', height: '100dvh' }} />}>
      <CallPageInner />
    </Suspense>
  );
}
