'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, CardTitle, Input } from '@bleucent/ui';
import { authClient, signUp } from '@/lib/auth-client';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const userResult = await signUp.email({ name, email, password });
    if (userResult.error) {
      setLoading(false);
      setError(userResult.error.message ?? 'Sign up failed');
      return;
    }

    const orgResult = await authClient.organization.create({
      name: orgName || `${name}'s team`,
      slug: slugify(orgName || name) || `org-${Date.now()}`,
    });
    setLoading(false);
    if (orgResult.error) {
      setError(`Account created but organization setup failed: ${orgResult.error.message}`);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Card>
        <CardHeader>
          <CardTitle>Create your organization</CardTitle>
        </CardHeader>
        <CardBody>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1 text-sm">
              <span>Your name</span>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Work email</span>
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
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Organization name</span>
              <Input
                placeholder="Acme Engineering"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </label>
            {error && (
              <p className="rounded-md border border-red-700/60 bg-red-900/30 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create account'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
