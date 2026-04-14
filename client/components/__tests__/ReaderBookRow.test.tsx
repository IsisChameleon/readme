import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ReaderBookRow } from '../ReaderBookRow';

describe('ReaderBookRow', () => {
  it('renders with partial progress', () => {
    const { container } = render(
      <ReaderBookRow title="The Little Prince" progress={42} kidColor="#5CB87A" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders at 0%', () => {
    const { container } = render(
      <ReaderBookRow title="Unread Book" progress={0} kidColor="#FF6B6B" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders at 100%', () => {
    const { container } = render(
      <ReaderBookRow title="Finished" progress={100} kidColor="#A78BDA" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
