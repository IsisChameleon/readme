import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  LED: () => <i data-testid="led" />,
}));

vi.mock('@pipecat-ai/voice-ui-kit/webgl', () => ({
  Plasma: () => null,
}));

vi.mock('@/components/AnimatedOrb', () => ({
  AnimatedOrb: () => <div data-testid="orb" />,
}));

describe('SessionInner', () => {
  it('does not auto-fire handleConnect (PipecatAppBase connectOnMount owns that)', () => {
    const handleConnect = vi.fn();
    render(
      <SessionInner
        handleConnect={handleConnect}
        handleDisconnect={vi.fn()}
        visualMode="dragon"
      />
    );
    expect(handleConnect).not.toHaveBeenCalled();
  });

  it('renders mic control and orb', () => {
    render(
      <SessionInner
        handleConnect={vi.fn()}
        handleDisconnect={vi.fn()}
        visualMode="dragon"
      />
    );
    expect(screen.getByTestId('mic-control')).toBeInTheDocument();
    expect(screen.getByTestId('orb')).toBeInTheDocument();
  });
});
