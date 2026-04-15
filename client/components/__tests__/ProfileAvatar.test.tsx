import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileAvatar } from '../ProfileAvatar';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseProps = {
  userName: 'Jane Doe',
  userEmail: 'jane@example.com',
  householdId: 'abc123',
};

describe('ProfileAvatar', () => {
  it('renders closed state — no hover tooltip', () => {
    const { container } = render(<ProfileAvatar {...baseProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders open popover with Library + Manage readers + Sign out + Delete', () => {
    const { container, getByText } = render(<ProfileAvatar {...baseProps} />);
    fireEvent.click(container.querySelector('button')!);
    expect(getByText('Library')).toBeTruthy();
    expect(getByText('Manage readers')).toBeTruthy();
    expect(getByText('Sign out')).toBeTruthy();
    expect(getByText('Delete account')).toBeTruthy();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('collapses Library row when currentPath is library', () => {
    const { container, getByText } = render(
      <ProfileAvatar {...baseProps} currentPath="library" />
    );
    fireEvent.click(container.querySelector('button')!);
    const libraryRow = getByText(/Library/);
    expect(libraryRow.closest('div')?.className).toContain('italic');
    expect(container.firstChild).toMatchSnapshot();
  });

  it('collapses Manage readers row when currentPath is readers', () => {
    const { container, getByText } = render(
      <ProfileAvatar {...baseProps} currentPath="readers" />
    );
    fireEvent.click(container.querySelector('button')!);
    const readersRow = getByText(/Manage readers/);
    expect(readersRow.closest('div')?.className).toContain('italic');
    expect(container.firstChild).toMatchSnapshot();
  });
});
