"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Users, Plus, Server } from "lucide-react"
import { cn } from "@/lib/utils"
import { gatewayAPI } from "@/lib/api"
import { useWebSocket } from "@/lib/websocket-context"
import { CreateRealmModal } from "./create-realm-modal"
import { ActivityFeed } from "./activity-feed"

export function RealmsMonitor() {
  const { realms, loops, loading, error, refreshRealms, isConnected } = useWebSocket()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const monitorId = useState(() => Math.random().toString(36).substr(2, 9))[0]

  console.log(`📊 [RealmsMonitor-${monitorId}] Component rendered, realms: ${realms.length}, loops: ${loops.length}, loading: ${loading}, error: ${error}, connected: ${isConnected}`)

  useEffect(() => {
    console.log(`📊 [RealmsMonitor-${monitorId}] Component mounted`)
    return () => {
      console.log(`📊 [RealmsMonitor-${monitorId}] Component unmounting`)
    }
  }, [monitorId])

  useEffect(() => {
    console.log(`📊 [RealmsMonitor-${monitorId}] CreateModal state changed: ${createModalOpen}`)
  }, [createModalOpen, monitorId])

  const handleCreateRealm = async (newRealm: any) => {
    console.log(`📊 [RealmsMonitor-${monitorId}] handleCreateRealm called with:`, newRealm)
    try {
      // Create realm in gateway
      console.log(`📊 [RealmsMonitor-${monitorId}] Creating realm in gateway...`)
      await gatewayAPI.createRealm({
        id: newRealm.name.toLowerCase().replace(/\s+/g, '-'),
        parent_id: newRealm.parent || null,
        policies: []
      })

      console.log(`📊 [RealmsMonitor-${monitorId}] Realm created successfully, closing modal`)
      // Close modal
      setCreateModalOpen(false)

      console.log(`📊 [RealmsMonitor-${monitorId}] Refreshing realms list...`)
      // Refresh realms list using context
      await refreshRealms()
      console.log(`📊 [RealmsMonitor-${monitorId}] Realms refresh completed`)
    } catch (err) {
      console.error(`📊 [RealmsMonitor-${monitorId}] Failed to create realm:`, err)
      alert('Failed to create realm. Make sure the gateway is running.')
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading realms...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to connect to gateway</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <p className="text-xs text-muted-foreground">
              WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure the gateway is running on localhost:3001
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Single Page Dashboard Layout */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Dashboard Stats */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">DASHBOARD</h2>
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Realms</p>
                    <p className="text-3xl font-bold">{realms.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Agents</p>
                    <p className="text-3xl font-bold">
                      {realms.reduce((acc, r) => acc + r.agentsCount, 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Services</p>
                    <p className="text-3xl font-bold">
                      {realms.reduce((acc, r) => acc + r.servicesCount, 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Events</p>
                    <p className="text-3xl font-bold">
                      {realms.reduce((acc, r) => acc + r.eventsPerMinute, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">/min</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Connected Realms */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">CONNECTED REALMS</h2>
              <Button
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Realm
              </Button>
            </div>

            {realms.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Server className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground mb-1">No realms connected</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create a realm or start an agent to begin
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCreateModalOpen(true)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Create Realm
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {realms.map(realm => (
                      <div
                        key={realm.id}
                        className="flex items-center justify-between p-4 transition-colors hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{realm.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {realm.latency}ms
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{realm.agentsCount} agents</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "flex h-2 w-2 rounded-full",
                            realm.status === 'connected' ? "bg-green-500" : "bg-gray-500"
                          )} />
                          <span className="text-sm text-muted-foreground">
                            {realm.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Real-Time Activity Feed */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">⚡ REAL-TIME ACTIVITY FEED</h2>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Live' : 'Disconnected'}
                </span>
              </div>
            </div>
            <ActivityFeed />
          </div>
        </div>
      </div>

      {/* Create Realm Modal */}
      <CreateRealmModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateRealm={handleCreateRealm}
        existingRealms={realms as any}
      />
    </div>
  )
}