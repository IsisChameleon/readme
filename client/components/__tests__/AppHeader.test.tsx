import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppHeader } from '../AppHeader';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../EmberLogo', () => ({
  EmberLogo: ({ size, className }: { size: number; className: string }) => (
    <div data-testid="ember-logo" data-size={size} className={className} />
  ),
}));

describe('AppHeader', () => {
  it('renders default (home) — no back, no right slot', () => {
    const { container } = render(<AppHeader />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with back arrow and right slot', () => {
    const { container } = render(
      <AppHeader backHref="/h/abc" right={<div data-testid="avatar" />} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom subtitle', () => {
    const { container } = render(
      <AppHeader subtitle="Enchanted Forest Style Guide" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('hides wordmark on small screens by default', () => {
    const { container } = render(<AppHeader />);
    const wordmark = container.querySelector('[class*="hidden sm:block"]');
    expect(wordmark).toBeTruthy();
  });
});
