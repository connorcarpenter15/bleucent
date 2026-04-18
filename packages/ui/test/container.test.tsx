import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Container } from '../src/container';

describe('Container', () => {
  it('uses size=lg (max-w-6xl) by default', () => {
    render(<Container data-testid="c">x</Container>);
    expect(screen.getByTestId('c').className).toContain('max-w-6xl');
  });

  it('switches max-width per size', () => {
    const { rerender } = render(
      <Container size="sm" data-testid="c">
        x
      </Container>,
    );
    expect(screen.getByTestId('c').className).toContain('max-w-3xl');
    rerender(
      <Container size="full" data-testid="c">
        x
      </Container>,
    );
    expect(screen.getByTestId('c').className).toContain('max-w-none');
  });

  it('always centers and pads horizontally', () => {
    render(<Container data-testid="c">x</Container>);
    const cls = screen.getByTestId('c').className;
    expect(cls).toContain('mx-auto');
    expect(cls).toContain('px-6');
  });
});
