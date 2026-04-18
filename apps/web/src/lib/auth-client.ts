'use client';
import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

function makeClient() {
  return createAuthClient({
    baseURL:
      typeof window === 'undefined'
        ? process.env.BETTER_AUTH_URL
        : `${window.location.protocol}//${window.location.host}`,
    plugins: [organizationClient()],
  });
}

export const authClient: ReturnType<typeof makeClient> = makeClient();

export const signIn = authClient.signIn;
export const signOut = authClient.signOut;
export const signUp = authClient.signUp;
export const useSession = authClient.useSession;
export const useActiveOrganization = authClient.useActiveOrganization;
