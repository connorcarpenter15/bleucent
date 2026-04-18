import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
};

const sizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-none',
} as const;

/** Centered horizontal container with consistent gutters. */
export function Container({ className, size = 'lg', ...rest }: ContainerProps) {
  return <div className={cn('mx-auto w-full px-6 sm:px-8', sizes[size], className)} {...rest} />;
}
