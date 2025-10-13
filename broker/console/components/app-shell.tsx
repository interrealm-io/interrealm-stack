"use client"

import { useState, useEffect } from "react"
import { Network, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { RealmTreeTopology } from "./realm-tree-topology"
import { RealmsMonitor } from "./realms-monitor"
import { AdminPage } from "./admin-page"
import { WebSocketProvider } from "@/lib/websocket-context"

type NavSection = "dashboard" | "topology" | "admin"

export function AppShell() {
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard")

  const shellId = useState(() => Math.random().toString(36).substr(2, 9))[0]

  console.log(`🏠 [AppShell-${shellId}] Component rendered, activeSection: ${activeSection}`)

  useEffect(() => {
    console.log(`🏠 [AppShell-${shellId}] Component mounted`)
    return () => {
      console.log(`🏠 [AppShell-${shellId}] Component unmounting`)
    }
  }, [shellId])

  useEffect(() => {
    console.log(`🏠 [AppShell-${shellId}] Active section changed to: ${activeSection}`)
  }, [activeSection, shellId])

  return (
    <WebSocketProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-gray-900 px-6 py-4 text-white">
          <div>
            <h1 className="text-2xl font-bold">Realm Mesh</h1>
            <p className="mt-1 text-sm text-gray-400">Authentic-V1</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection("admin")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                activeSection === "admin"
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              )}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveSection("topology")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                activeSection === "topology"
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              )}
              title="Topology View"
            >
              <Network className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeSection === "dashboard" && <RealmsMonitor />}
          {activeSection === "topology" && <RealmTreeTopology />}
          {activeSection === "admin" && <AdminPage />}
        </div>
      </div>
    </WebSocketProvider>
  )
}
