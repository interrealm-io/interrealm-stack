'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [apiToken, setApiToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  console.log('[LoginPage] Component rendered', {
    hasToken: !!apiToken,
    tokenLength: apiToken.length,
    isLoading,
    hasError: !!error
  });

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[LoginPage] Form submitted');
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('[LoginPage] Starting login process');

    try {
      await login(apiToken);
      console.log('[LoginPage] Login successful');
    } catch (err) {
      console.error('[LoginPage] Login failed:', err);
      setError('Authentication failed. Please check your API token.');
      console.error(err);
    } finally {
      console.log('[LoginPage] Login process completed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Nexus Console</CardTitle>
          <CardDescription>Enter your API token to access the InterRealm Mesh</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                placeholder="Enter your API token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
