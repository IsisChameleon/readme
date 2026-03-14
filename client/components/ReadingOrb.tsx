'use client';

import { Component } from 'react';
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
          width={600}
          height={600}
          initialConfig={PLASMA_CONFIG}
          audioTrack={undefined}
          style={{ width: '100%', height: '100%' }}
        />
      );
      PlasmaWrapper.displayName = 'PlasmaWrapper';
      return PlasmaWrapper;
    }),
  { ssr: false },
);

const CSSGradientOrb = () => (
  <div
    className="w-full h-full"
    style={{
      background: 'radial-gradient(circle at 40% 40%, var(--db-primary), var(--db-accent), transparent 70%)',
    }}
  />
);

export const ReadingOrb = () => (
  <Link
    href="/call?autoconnect=true"
    aria-label="Start reading session"
    className="flex flex-col items-center justify-center flex-1 cursor-pointer"
  >
    <div className="reading-orb flex items-center justify-center rounded-full overflow-hidden">
      <PlasmaErrorBoundary fallback={<CSSGradientOrb />}>
        <PlasmaOrb />
      </PlasmaErrorBoundary>
    </div>

    <div className="text-center pb-4">
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
  </Link>
);
