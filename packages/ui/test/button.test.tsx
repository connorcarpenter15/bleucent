import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../src/button';

describe('Button', () => {
  it('renders children inside a <button>', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('uses primary variant + medium size by default', () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-accent-500');
    expect(btn.className).toContain('h-10');
  });

  it('switches classes per variant', () => {
    const { rerender } = render(<Button variant="ghost">x</Button>);
    expect(screen.getByRole('button').className).toContain('bg-transparent');
    rerender(<Button variant="danger">x</Button>);
    expect(screen.getByRole('button').className).toContain('bg-red-600');
  });

  it('switches classes per size', () => {
    const { rerender } = render(<Button size="sm">s</Button>);
    expect(screen.getByRole('button').className).toContain('h-8');
    rerender(<Button size="lg">l</Button>);
    expect(screen.getByRole('button').className).toContain('h-12');
  });

  it('forwards arbitrary props and merges className', () => {
    render(
      <Button className="custom-x" data-testid="b" disabled>
        x
      </Button>,
    );
    const btn = screen.getByTestId('b');
    expect(btn).toBeDisabled();
    expect(btn.className).toContain('custom-x');
  });

  it('calls onClick when not disabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        go
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
