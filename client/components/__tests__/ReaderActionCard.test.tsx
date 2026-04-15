import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ReaderActionCard } from '../ReaderActionCard';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string } & Record<string, unknown>>) => (
    <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
}));
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

const kid = { id: 'k1', name: 'Fynn', avatar: null, color: '#5CB87A' };

describe('ReaderActionCard', () => {
  it('renders empty-state (no books started)', () => {
    const { container } = render(
      <ReaderActionCard householdId="h1" kid={kid} lastBook={null} bookCount={3} index={0} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders resuming state', () => {
    const { container } = render(
      <ReaderActionCard
        householdId="h1"
        kid={kid}
        lastBook={{ bookId: 'b1', bookTitle: 'The Gruffalo', progress: 45 }}
        bookCount={8}
        index={0}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders finished state', () => {
    const { container } = render(
      <ReaderActionCard
        householdId="h1"
        kid={kid}
        lastBook={{ bookId: 'b1', bookTitle: 'Goodnight Moon', progress: 100 }}
        bookCount={8}
        index={0}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
