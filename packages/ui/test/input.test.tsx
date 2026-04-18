import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Field, Input, Textarea } from '../src/input';

describe('Input', () => {
  it('renders an <input>', () => {
    render(<Input placeholder="email" />);
    const el = screen.getByPlaceholderText('email');
    expect(el.tagName).toBe('INPUT');
  });

  it('forwards onChange', () => {
    const onChange = vi.fn();
    render(<Input data-testid="i" onChange={onChange} />);
    fireEvent.change(screen.getByTestId('i'), { target: { value: 'hi' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('honors the disabled flag', () => {
    render(<Input data-testid="i" disabled />);
    expect(screen.getByTestId('i')).toBeDisabled();
  });
});

describe('Textarea', () => {
  it('renders a <textarea> with the min-height utility', () => {
    render(<Textarea data-testid="t" />);
    const el = screen.getByTestId('t');
    expect(el.tagName).toBe('TEXTAREA');
    expect(el.className).toContain('min-h-[88px]');
  });
});

describe('Field', () => {
  it('renders the uppercase label and a hint', () => {
    render(
      <Field label="Email" hint="we never spam">
        <Input />
      </Field>,
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('we never spam')).toBeInTheDocument();
  });

  it('shows the error in red and suppresses the hint', () => {
    render(
      <Field label="Email" hint="we never spam" error="required">
        <Input />
      </Field>,
    );
    expect(screen.getByText('required')).toBeInTheDocument();
    expect(screen.queryByText('we never spam')).toBeNull();
  });
});
