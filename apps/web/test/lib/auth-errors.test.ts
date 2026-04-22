import { describe, expect, it } from 'vitest';
import { messageFromAuthError } from '../../src/lib/auth-errors';

describe('messageFromAuthError', () => {
  it('returns fallback for null/undefined', () => {
    expect(messageFromAuthError(null, 'fb')).toBe('fb');
    expect(messageFromAuthError(undefined, 'fb')).toBe('fb');
  });

  it('returns string as-is', () => {
    expect(messageFromAuthError('Wrong password', 'fb')).toBe('Wrong password');
  });

  it('reads .message from object', () => {
    expect(messageFromAuthError({ message: 'Incorrect email or password' }, 'fb')).toBe(
      'Incorrect email or password',
    );
  });

  it('reads .msg as fallback', () => {
    expect(messageFromAuthError({ msg: 'Nope' }, 'fb')).toBe('Nope');
  });
});
