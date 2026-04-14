import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { UploadActionCard } from '../UploadActionCard';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiClient: { POST: vi.fn() } }));
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
          <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>,
    }
  ),
}));

describe('UploadActionCard', () => {
  it('renders default state', () => {
    const { container } = render(<UploadActionCard householdId="h1" index={0} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
