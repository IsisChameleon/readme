import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BookCard } from '../BookCard';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({}) }));
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => {
        const Comp = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
          <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
        );
        return Comp;
      },
    }
  ),
}));

const baseBook = {
  id: 'b1',
  title: 'Where the Wild Things Are',
  author: 'Maurice Sendak',
  status: 'ready',
  coverImageUrl: null,
};

describe('BookCard', () => {
  it('renders reader variant at 0% progress', () => {
    const { container } = render(
      <BookCard variant="reader" book={{ ...baseBook, progress: 0 }} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders reader variant mid-read', () => {
    const { container } = render(
      <BookCard variant="reader" book={{ ...baseBook, progress: 45 }} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders reader variant complete', () => {
    const { container } = render(
      <BookCard variant="reader" book={{ ...baseBook, progress: 100 }} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders parent variant with no readers', () => {
    const { container } = render(
      <BookCard variant="parent" book={baseBook} kidProgress={[]} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders parent variant with multiple readers', () => {
    const { container } = render(
      <BookCard
        variant="parent"
        book={baseBook}
        kidProgress={[
          { kidId: 'k1', kidName: 'Fynn', kidColor: '#5CB87A', progress: 80 },
          { kidId: 'k2', kidName: 'Luca', kidColor: '#A78BDA', progress: 25 },
        ]}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
