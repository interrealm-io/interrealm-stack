'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { MeshConsole } from '@/components/mesh-console';

export default function DashboardPage() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Persistent Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
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

      {/* Main Console Area */}
      <main className="flex-1 overflow-hidden">
        <MeshConsole />
      </main>
    </div>
  );
}
