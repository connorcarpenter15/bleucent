import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

const baseClasses = cn(
  'w-full rounded-md border border-surface-700 bg-surface-950/80 px-3 py-2 text-sm text-surface-100',
  'placeholder:text-surface-500',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:border-accent-500',
  'disabled:opacity-50',
  'transition-colors',
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(baseClasses, className)} {...rest} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(baseClasses, 'min-h-[88px]', className)} {...rest} />;
});

type FieldProps = {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
};

/** Labelled form field wrapper. Pairs with `<Input />` / `<Textarea />`. */
export function Field({ label, hint, error, children, className }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-sm', className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-surface-400">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-surface-500">{hint}</span>}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </label>
  );
}
