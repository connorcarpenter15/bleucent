'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, CardTitle, Input, Textarea } from '@bleucent/ui';

export default function NewInterviewPage() {
  const router = useRouter();
  const [title, setTitle] = useState('Senior Backend Loop');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [constraints, setConstraints] = useState(
    'Use async asyncpg instead of psycopg2.\nNo external API calls.',
  );
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    const res = await fetch('/api/interviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title,
        candidateName,
        candidateEmail,
        initialConstraints: constraints
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
      }),
    });
    setCreating(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const { interviewId } = (await res.json()) as { interviewId: string };
    router.push(`/interviews/${interviewId}/conduct`);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>New interview</CardTitle>
        </CardHeader>
        <CardBody>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <label className="flex flex-col gap-1 text-sm">
              <span>Title</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Candidate name</span>
              <Input
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Candidate email</span>
              <Input
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Initial AI constraints (one per line)</span>
              <Textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} />
              <span className="text-xs text-slate-500">
                Injected into every AI prompt during the session. You can add or remove constraints
                live from God Mode.
              </span>
            </label>
            {error && (
              <p className="rounded-md border border-red-700/60 bg-red-900/30 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create interview'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
