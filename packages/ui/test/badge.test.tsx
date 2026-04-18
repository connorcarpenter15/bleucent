import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '../src/badge';

describe('Badge', () => {
  it('renders the label text', () => {
    render(<Badge>Live</Badge>);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('uses neutral tone by default', () => {
    render(<Badge data-testid="b">x</Badge>);
    expect(screen.getByTestId('b').className).toContain('bg-surface-800');
  });

  it('switches tone classes', () => {
    render(
      <Badge tone="accent" data-testid="b">
        x
      </Badge>,
    );
    expect(screen.getByTestId('b').className).toContain('bg-accent-500/15');
  });

  it('renders a status dot when dot=true', () => {
    const { container } = render(
      <Badge tone="success" dot>
        Ready
      </Badge>,
    );
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain('bg-emerald-400');
  });

  it('omits the dot by default', () => {
    const { container } = render(<Badge>Quiet</Badge>);
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });
});
