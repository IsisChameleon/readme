'use client';

import { usePipecatClient, usePipecatClientMediaTrack } from '@pipecat-ai/client-react';
import {
  PipecatAppBase,
  TranscriptOverlay,
  UserAudioControl,
  usePipecatConnectionState,
} from '@pipecat-ai/voice-ui-kit';
import { Plasma } from '@pipecat-ai/voice-ui-kit/webgl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

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
  connecting: '#F5A623',
  disconnected: '#FF6B6B',
};

const SessionInner = ({ handleDisconnect }: { handleDisconnect: () => void | Promise<void> }) => {
  const client = usePipecatClient();
  const remoteAudioTrack = usePipecatClientMediaTrack('audio', 'bot');
  const { state: connectionState, isDisconnected } = usePipecatConnectionState();
  const router = useRouter();
  const lastTapRef = useRef<number>(0);
  const wasConnectedRef = useRef(false);
  const handleDisconnectRef = useRef(handleDisconnect);
  const clientRef = useRef(client);
  handleDisconnectRef.current = handleDisconnect;
  clientRef.current = client;

  // Clean up voice session on unmount (browser back, navigation) and tab close/refresh.
  // Guards on client.connected so it's a no-op when there's no active session.
  useEffect(() => {
    const cleanup = () => {
      if (!clientRef.current?.connected) return;
      handleDisconnectRef.current?.();
      clientRef.current.disconnect();
    };
    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (connectionState === 'connected') {
      wasConnectedRef.current = true;
    }
    if (isDisconnected && wasConnectedRef.current) {
      router.push('/dashboard');
    }
  }, [connectionState, isDisconnected, router]);

  const onDisconnect = async () => {
    try {
      await handleDisconnect?.();
      await client?.disconnect();
    } finally {
      router.push('/dashboard');
    }
  };

  const handleOrbTap = async () => {
    const now = Date.now();
    const timeSinceLast = now - lastTapRef.current;

    if (timeSinceLast < 300) {
      await onDisconnect();
      return;
    }

    lastTapRef.current = now;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#150f20', position: 'relative' }}>
      {/* Top bar — overlaid on top of orb */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', zIndex: 10 }}>
        <button
          onClick={onDisconnect}
          style={{ color: '#9ca3af', fontFamily: 'var(--font-nunito)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[connectionState] ?? '#FF6B6B' }} />
          <span style={{ fontSize: '12px', color: STATUS_COLORS[connectionState] ?? '#FF6B6B', fontFamily: 'var(--font-nunito)' }}>
            {connectionState}
          </span>
        </div>
      </div>

      {/* Orb — fills all available space */}
      <div
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 0 }}
        onClick={handleOrbTap}
        role="button"
        aria-label="Double-tap to leave call"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOrbTap(); }}
      >
        <Plasma
          width={600}
          height={600}
          initialConfig={PLASMA_CONFIG}
          audioTrack={remoteAudioTrack ?? undefined}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Bottom controls — overlaid on bottom of orb */}
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
        <div style={{ marginTop: '8px' }}>
          <UserAudioControl visualizerProps={{ barCount: 5 }} />
        </div>
      </div>
    </div>
  );
};

export const VoiceSession = () => (
  <PipecatAppBase
    transportType="daily"
    connectParams={{ endpoint: '/api/start' }}
    connectOnMount
    initDevicesOnMount
    themeProps={{ defaultTheme: 'dark' }}
  >
    {({ handleDisconnect }) => (
      <SessionInner handleDisconnect={handleDisconnect ?? (() => {})} />
    )}
  </PipecatAppBase>
);
