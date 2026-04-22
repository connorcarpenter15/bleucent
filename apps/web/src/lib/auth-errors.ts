/**
 * Normalizes `error` values returned by @neondatabase/auth client methods
 * (sign-in, sign-up, organization.create, etc.) for display in the UI.
 */
export function messageFromAuthError(err: unknown, fallback: string): string {
  if (err == null || err === false) {
    return fallback;
  }
  if (typeof err === 'string') {
    return err;
  }
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message.length > 0) {
      return o.message;
    }
    if (typeof o.msg === 'string' && o.msg.length > 0) {
      return o.msg;
    }
  }
  return fallback;
}
