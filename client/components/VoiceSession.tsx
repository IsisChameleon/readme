'use client';

import { usePipecatClientMediaTrack } from '@pipecat-ai/client-react';
import {
  ConnectButton,
  PipecatAppBase,
  TranscriptOverlay,
  UserAudioControl,
  usePipecatConnectionState,
} from '@pipecat-ai/voice-ui-kit';
import { Plasma } from '@pipecat-ai/voice-ui-kit/webgl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useEffect } from 'react';

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

interface SessionInnerProps {
  handleConnect?: () => void | Promise<void>;
  handleDisconnect?: () => void | Promise<void>;
}

const SessionInner = ({ handleConnect, handleDisconnect }: SessionInnerProps) => {
  const remoteAudioTrack = usePipecatClientMediaTrack('audio', 'bot');
  const { state: connectionState } = usePipecatConnectionState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoConnectAttempted = useRef(false);

  useEffect(() => {
    if (searchParams.get('autoconnect') === 'true' && handleConnect && !autoConnectAttempted.current) {
      autoConnectAttempted.current = true;
      handleConnect();
    }
  }, [searchParams, handleConnect]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#150f20', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', zIndex: 10 }}>
        <button
          onClick={() => router.push('/dashboard')}
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

      {/* Orb */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <Plasma
          width={600}
          height={600}
          initialConfig={PLASMA_CONFIG}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <UserAudioControl visualizerProps={{ barCount: 5 }} />
          <ConnectButton
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      </div>
    </div>
  );
};

export const VoiceSession = () => {
  const handleDisconnectRef = useRef<(() => void | Promise<void>) | undefined>(undefined);

  return (
    <PipecatAppBase
      transportType="daily"
      connectParams={{ endpoint: '/api/start' }}
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
      {({ handleConnect, handleDisconnect }) => {
        handleDisconnectRef.current = handleDisconnect;
        return <SessionInner handleConnect={handleConnect} handleDisconnect={handleDisconnect} />;
      }}
    </PipecatAppBase>
  );
};
