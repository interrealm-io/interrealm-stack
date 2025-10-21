"use client";

import { AgentList } from "@/components/agent-list";
import { ActivityMonitor } from "@/components/activity-monitor";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AgentActivityProvider } from "@/lib/agent-activity-context";

export default function Home() {
  return (
    <AgentActivityProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Left Side: Agent Management */}
        <div className="flex flex-1 flex-col overflow-y-auto border-r">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground">N</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-none tracking-tight">Nexus MVP</h1>
                <p className="text-xs text-muted-foreground">InterRealm Foundation</p>
              </div>
            </div>
            <ThemeSwitcher />
          </div>
        </div>

        {/* Agent List */}
        <main className="flex-1 p-6">
          <AgentList />
        </main>
      </div>

        {/* Right Side: Activity Monitor */}
        <div className="w-1/2">
          <ActivityMonitor />
        </div>
      </div>
    </AgentActivityProvider>
  );
}
