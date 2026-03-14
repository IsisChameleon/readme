'use client';

import { Component } from 'react';
import { Microphone } from '@phosphor-icons/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const PLASMA_CONFIG = {
  useCustomColors: true,
  color1: '#FF6B6B',
  color2: '#7DC4A6',
  color3: '#A78BDA',
  intensity: 1.2,
  radius: 1.0,
  ringCount: 4,
  backgroundColor: '#150f20',
  audioEnabled: false,
  audioSensitivity: 0,
};

class PlasmaErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const PlasmaOrb = dynamic(
  () =>
    import('@pipecat-ai/voice-ui-kit/webgl').then(({ Plasma }) => {
      const PlasmaWrapper = () => (
        <Plasma
          width={240}
          height={240}
          initialConfig={PLASMA_CONFIG}
          audioTrack={undefined}
          style={{ width: 120, height: 120 }}
        />
      );
      PlasmaWrapper.displayName = 'PlasmaWrapper';
      return PlasmaWrapper;
    }),
  { ssr: false },
);

const CSSGradientOrb = () => (
  <div
    className="rounded-full"
    style={{
      width: 120,
      height: 120,
      background: 'radial-gradient(circle at 35% 35%, var(--db-primary), var(--db-accent))',
    }}
  />
);

export const ReadingOrb = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    {/* Glow backdrop */}
    <div className="relative">
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 200,
          height: 200,
          top: -40,
          left: -40,
          background: 'radial-gradient(circle, var(--db-glow), transparent 70%)',
        }}
      />
      <Link href="/call?autoconnect=true" aria-label="Start reading session">
        <div
          className="reading-orb relative rounded-full flex items-center justify-center cursor-pointer overflow-hidden transition-transform hover:scale-105"
          style={{ boxShadow: '0 8px 40px var(--db-glow)' }}
        >
          <PlasmaErrorBoundary fallback={<CSSGradientOrb />}>
            <PlasmaOrb />
          </PlasmaErrorBoundary>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Microphone weight="fill" size={28} color="#fff" />
          </div>
        </div>
      </Link>
    </div>

    {/* Labels */}
    <div className="text-center">
      <p
        className="text-base font-bold"
        style={{ color: 'var(--db-primary)', fontFamily: 'var(--font-nunito)' }}
      >
        Start Reading
      </p>
      <p
        className="text-xs mt-1"
        style={{ color: 'var(--db-muted-fg)' }}
      >
        Tap to talk with your reading buddy
      </p>
    </div>
  </div>
);
