import { describe, expect, it } from 'vitest';
import { cn } from '../src/cn';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('handles arrays and conditional objects (clsx semantics)', () => {
    expect(cn(['a', { b: true, c: false }], 'd')).toBe('a b d');
  });

  it('resolves Tailwind conflicts via tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('keeps unrelated utilities intact', () => {
    expect(cn('flex items-center', 'gap-2')).toBe('flex items-center gap-2');
  });
});
