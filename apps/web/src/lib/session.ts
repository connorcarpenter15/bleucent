import { headers } from 'next/headers';
import { auth } from './auth';

/** Returns the current Better Auth session for a server component / route handler. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session;
}
