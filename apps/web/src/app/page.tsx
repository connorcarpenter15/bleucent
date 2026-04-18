import Link from 'next/link';
import { Button, Card, CardBody, CardHeader, CardTitle } from '@bleucent/ui';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <div className="flex flex-col items-start gap-6">
        <span className="rounded-full border border-blue-700/60 bg-blue-900/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-blue-300">
          Beta
        </span>
        <h1 className="text-5xl font-semibold tracking-tight">
          Synchronous, observable technical interviews.
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Bleucent gives candidates a real IDE, a system-design canvas, and an AI co-pilot &mdash;
          and gives interviewers a live God Mode dashboard with perfect playback after the fact.
        </p>
        <div className="flex gap-3">
          <Link href="/login">
            <Button size="lg">Interviewer sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Create an organization
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Real-time canvas + IDE</CardTitle>
          </CardHeader>
          <CardBody className="text-sm text-slate-300">
            React Flow + Monaco synced over Yjs CRDTs. Zero merge conflicts even when both
            participants type at once.
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Context-aware AI co-pilot</CardTitle>
          </CardHeader>
          <CardBody className="text-sm text-slate-300">
            The orchestrator injects the current filesystem, the architecture canvas, and any
            interviewer constraints into every prompt.
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ephemeral sandboxes</CardTitle>
          </CardHeader>
          <CardBody className="text-sm text-slate-300">
            Each interview gets its own sandbox container and an isolated Neon database branch,
            torn down the moment the session ends.
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
