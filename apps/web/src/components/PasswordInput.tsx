'use client';

import { useId, useState, type InputHTMLAttributes } from 'react';
import { Input, cn } from '@leucent/ui';

const EyeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className={cn('h-5 w-5', className)}
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className={cn('h-5 w-5', className)}
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9.88 9.88a3 3 0 1 0 4.24 4.24"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 2l20 20" />
  </svg>
);

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  className?: string;
};

/**
 * Single-line password input with a show/hide toggle. Keeps the control
 * keyboard-accessible (`type="button"`, `aria-pressed` + `aria-label`).
 */
export function PasswordInput({
  className,
  disabled,
  id,
  autoComplete,
  ...rest
}: PasswordInputProps) {
  const autoId = useId();
  const inputId = id ?? `pwd-${autoId.replace(/:/g, '')}`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={inputId}
        className={cn('pr-11', className)}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        disabled={disabled}
        {...rest}
      />
      <button
        type="button"
        className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-2 text-surface-400 transition-colors hover:bg-surface-800/80 hover:text-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent-500 disabled:pointer-events-none disabled:opacity-40"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-controls={inputId}
        disabled={disabled}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
