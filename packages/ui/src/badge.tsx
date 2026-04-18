import type { HTMLAttributes } from 'react';
import { cn } from './cn.js';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-800 text-slate-200 border-slate-700',
  success: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60',
  warning: 'bg-amber-900/40 text-amber-300 border-amber-700/60',
  danger: 'bg-red-900/40 text-red-300 border-red-700/60',
  info: 'bg-blue-900/40 text-blue-300 border-blue-700/60',
};

export function Badge({
  className,
  tone = 'neutral',
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
