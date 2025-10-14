'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function DashboardPage() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-foreground">Nexus Console</h1>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Button onClick={logout} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="mt-4 text-muted-foreground">
            Welcome to the Nexus Console. Mesh management features coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
