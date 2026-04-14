import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ReaderActionCard } from '../ReaderActionCard';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
          <button {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>,
    }
  ),
}));

const kid = { id: 'k1', name: 'Fynn', avatar: null, color: '#5CB87A' };

describe('ReaderActionCard', () => {
  it('renders empty-state (no books)', () => {
    const { container } = render(
      <ReaderActionCard householdId="h1" kid={kid} lastBook={null} readyBooks={[]} index={0} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders resuming state', () => {
    const { container } = render(
      <ReaderActionCard
        householdId="h1"
        kid={kid}
        lastBook={{
          bookId: 'b1',
          bookTitle: 'The Gruffalo',
          coverUrl: null,
          progress: 45,
        }}
        readyBooks={[]}
        index={0}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders single-book state', () => {
    const { container } = render(
      <ReaderActionCard
        householdId="h1"
        kid={kid}
        lastBook={null}
        readyBooks={[
          { id: 'b1', title: 'Where the Wild Things Are', author: 'Maurice Sendak', cover_image_url: null },
        ]}
        index={0}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
