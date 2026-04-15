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
