'use client';

import { Suspense, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { X, Eye, EyeOff } from 'lucide-react';
import { getAccessToken } from '@/lib/api/client';
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
import { AnimatedOrb } from '@/components/AnimatedOrb';

type VisualMode = 'plasma' | 'dragon';

const PLASMA_CONFIG = {
  useCustomColors: true,
  color1: '#FF6B6B',
  color2: '#7DC4A6',
  color3: '#A78BDA',
  intensity: 1.2,
  radius: 1.0,
  ringCount: 4,
  backgroundColor: '#150f20',
  audioEnabled: true,
  audioSensitivity: 1.5,
};

const STATUS_COLORS: Record<string, string> = {
  connected: '#7DC4A6',
  connecting: '#CAB8EB',
  disconnected: '#FF6B6B',
};

const CONNECT_BUTTON_STATE_CONTENT = {
  disconnected: { children: 'Start reading', variant: 'primary' as const },
  connecting: { children: 'Waking Ember…', variant: 'secondary' as const },
  authenticating: { children: 'Waking Ember…', variant: 'secondary' as const },
  authenticated: { children: 'Waking Ember…', variant: 'secondary' as const },
  connected: { children: 'End reading', variant: 'destructive' as const },
  ready: { children: 'End reading', variant: 'destructive' as const },
};

export const SessionInner = ({
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
  const remoteAudioTrack = usePipecatClientMediaTrack('audio', 'bot');
  const { state: connectionState } = usePipecatConnectionState();
  const router = useRouter();
  const params = useParams<{ householdId: string; readerId: string }>();
  const autoConnectAttempted = useRef(false);

  useEffect(() => {
    if (!canAutoConnect) return;
    if (!handleConnect) return;
    if (autoConnectAttempted.current) return;
    autoConnectAttempted.current = true;
    void handleConnect();
  }, [canAutoConnect, handleConnect]);

  const onUserDisconnect = useCallback(() => {
    autoConnectAttempted.current = false;
    return handleDisconnect?.();
  }, [handleDisconnect]);

  const handleBack = () => {
    router.push(`/h/${params.householdId}/reader/${params.readerId}`);
  };

  return (
    <div className="voice-session-bg" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100dvh', background: 'var(--vs-bg, #150f20)', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[connectionState] ?? '#FF6B6B' }} />
          <span style={{ fontSize: '12px', color: STATUS_COLORS[connectionState] ?? '#FF6B6B', fontFamily: 'var(--font-nunito)' }}>
            {connectionState}
          </span>
        </div>
        <button
          onClick={handleBack}
          style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Visual area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        {visualMode === 'plasma' ? (
          <Plasma
            width={600}
            height={600}
            initialConfig={PLASMA_CONFIG}
            audioTrack={remoteAudioTrack ?? undefined}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <AnimatedOrb isActive={connectionState === 'connected'} isSpeaking={false} />
        )}
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
          {connectionState === 'connected' && (
            <UserAudioControl visualizerProps={{ barCount: 5 }} />
          )}
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
              style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#CAB8EB', fontFamily: 'var(--font-nunito)' }}
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
  const [visualMode, setVisualMode] = useState<VisualMode>('dragon');
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const searchParams = useSearchParams();
  const bookId = searchParams.get('bookId');
  const params = useParams<{ readerId: string }>();

  useEffect(() => {
    getAccessToken().then(setAuthToken);
  }, []);

  const connectEndpoint =
    process.env.NEXT_PUBLIC_CONNECT_ENDPOINT || 'http://localhost:7860/start';

  const connectHeaders = useMemo(() => {
    const h = new Headers();
    const pipecatKey = process.env.NEXT_PUBLIC_PIPECAT_PUBLIC_KEY;
    if (pipecatKey) {
      h.set('Authorization', `Bearer ${pipecatKey}`);
    } else if (authToken) {
      h.set('Authorization', `Bearer ${authToken}`);
    }
    return h;
  }, [authToken]);

  const canAutoConnect = useMemo(() => {
    const pipecatKey = process.env.NEXT_PUBLIC_PIPECAT_PUBLIC_KEY;
    return Boolean(pipecatKey) || Boolean(authToken);
  }, [authToken]);

  return (
    <div className="vkui-root dark voice-ui-kit" style={{ width: '100%', height: '100dvh' }}>
      {/* Visual mode toggle */}
      <button
        onClick={() => setVisualMode((m) => (m === 'plasma' ? 'dragon' : 'plasma'))}
        style={{
          position: 'fixed',
          top: 16,
          right: 60,
          zIndex: 20,
          color: '#9ca3af',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
        }}
        title={`Switch to ${visualMode === 'plasma' ? 'dragon' : 'plasma'} mode`}
      >
        {visualMode === 'plasma' ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>

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
        themeProps={{ defaultTheme: 'dark' }}
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
              visualMode={visualMode}
              canAutoConnect={canAutoConnect}
            />
          );
        }}
      </PipecatAppBase>
    </div>
  );
};

export default function CallPage() {
  return (
    <Suspense fallback={<div style={{ width: '100%', height: '100dvh', background: 'var(--vs-bg, #150f20)' }} />}>
      <CallPageInner />
    </Suspense>
  );
}
