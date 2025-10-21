"use client";

import { ThemeSwitcher } from "./theme-switcher";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">N</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none tracking-tight">Nexus MVP</h1>
              <p className="text-xs text-muted-foreground">by InterRealm Foundation</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
