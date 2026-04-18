'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardBody, CardHeader, CardTitle, Input } from '@bleucent/ui';
import { signIn } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn.email({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? 'Sign in failed');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Card>
        <CardHeader>
          <CardTitle>Interviewer sign in</CardTitle>
        </CardHeader>
        <CardBody>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1 text-sm">
              <span>Email</span>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Password</span>
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <p className="rounded-md border border-red-700/60 bg-red-900/30 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="pt-2 text-center text-xs text-slate-400">
              No account yet? <Link href="/signup">Create an organization</Link>.
            </p>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
