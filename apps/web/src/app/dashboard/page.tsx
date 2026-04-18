import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from '@bleucent/ui';
import { schema } from '@bleucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const orgId = session.session.activeOrganizationId;
  const interviews = orgId
    ? await db()
        .select()
        .from(schema.interview)
        .where(eq(schema.interview.organizationId, orgId))
        .orderBy(desc(schema.interview.createdAt))
        .limit(50)
    : [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Interviews</h1>
          <p className="text-sm text-slate-400">
            Signed in as {session.user.email}
            {orgId ? '' : ' — finish creating an organization to schedule interviews.'}
          </p>
        </div>
        <Link href="/interviews/new">
          <Button>+ New interview</Button>
        </Link>
      </div>

      {interviews.length === 0 ? (
        <Card>
          <CardBody className="text-sm text-slate-300">
            No interviews yet.{' '}
            <Link href="/interviews/new" className="text-blue-400">
              Create your first interview
            </Link>{' '}
            to get a candidate join link.
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {interviews.map((iv) => (
            <Card key={iv.id}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{iv.title}</CardTitle>
                <StatusBadge status={iv.status} />
              </CardHeader>
              <CardBody className="text-sm text-slate-300">
                <div className="flex flex-col gap-1">
                  <span>Candidate: {iv.candidateName}</span>
                  <span className="text-slate-400">{iv.candidateEmail}</span>
                  <span className="text-xs text-slate-500">
                    Created {new Date(iv.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/interviews/${iv.id}/conduct`}>
                    <Button size="sm">Open God Mode</Button>
                  </Link>
                  {iv.status === 'completed' && (
                    <Link href={`/interviews/${iv.id}/replay`}>
                      <Button size="sm" variant="secondary">
                        Replay
                      </Button>
                    </Link>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'live'
      ? 'success'
      : status === 'scheduled'
        ? 'info'
        : status === 'completed'
          ? 'neutral'
          : 'warning';
  return <Badge tone={tone}>{status}</Badge>;
}
