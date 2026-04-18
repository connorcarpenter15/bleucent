import { env } from './env.js';

/** Thin client for the Python sandbox provisioner service. */

export type SandboxCreateResponse = {
  sandbox_id: string;
  status: 'ready' | 'provisioning' | 'failed';
  database_url?: string;
  neon_branch_id?: string;
};

/**
 * Creates a sandbox + ephemeral DB branch for an interview. The provisioner is
 * required to block until both the Neon branch passes a `SELECT 1` readiness
 * probe AND the in-container readiness check succeeds (see plan section 3D),
 * so when this call returns 200 the candidate environment is fully usable.
 */
export async function createSandbox(args: {
  interviewId: string;
  organizationId: string;
}): Promise<SandboxCreateResponse> {
  const res = await fetch(`${env().SANDBOX_PROVISIONER_URL}/sandboxes`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env().REALTIME_INTERNAL_TOKEN}`,
    },
    body: JSON.stringify({
      interview_id: args.interviewId,
      organization_id: args.organizationId,
    }),
  });
  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`sandbox provisioner returned ${res.status}: ${detail}`);
  }
  return (await res.json()) as SandboxCreateResponse;
}

export async function destroySandbox(sandboxId: string): Promise<void> {
  await fetch(`${env().SANDBOX_PROVISIONER_URL}/sandboxes/${sandboxId}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${env().REALTIME_INTERNAL_TOKEN}` },
  });
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '<no body>';
  }
}
