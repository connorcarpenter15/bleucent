import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { schema } from '@bleucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { GodMode } from './god-mode-client';

export const dynamic = 'force-dynamic';

/** Interviewer-only "God Mode" view. Live-mirrors the candidate's editor and
 * canvas, surfaces telemetry as an action log, accepts new AI constraints,
 * shows exec output, and exposes the canonical End Interview button. */
export default async function ConductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv) redirect('/dashboard');
  if (iv.organizationId !== session.session.activeOrganizationId) {
    redirect('/dashboard');
  }

  const constraints = await db()
    .select()
    .from(schema.interviewerConstraint)
    .where(eq(schema.interviewerConstraint.interviewId, id));

  return (
    <GodMode
      interviewId={id}
      title={iv.title}
      candidateName={iv.candidateName}
      status={iv.status}
      initialConstraints={constraints.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        revokedAt: c.revokedAt?.toISOString() ?? null,
      }))}
    />
  );
}
