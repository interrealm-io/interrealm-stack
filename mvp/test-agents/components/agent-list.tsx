"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentConfigDialog, AgentConfig } from "./agent-config-dialog";

interface Agent {
  id: string;
  name: string;
  description: string;
  status: "stopped" | "running" | "error";
}

const availableAgents: Agent[] = [
  {
    id: "ping-pong",
    name: "Ping-Pong",
    description: "A pair of agents that send ping and pong messages back and forth",
    status: "stopped",
  },
];

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>(availableAgents);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const handleStartClick = (agentId: string) => {
    setSelectedAgent(agentId);
    setConfigDialogOpen(true);
  };

  const handleStartAgent = async (config: AgentConfig) => {
    const agentId = selectedAgent;
    if (!agentId) return;

    // Update agent status to running
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, status: "running" as const } : agent
      )
    );

    try {
      // Call API to start the agent
      const response = await fetch("/api/agents/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start agent");
      }

      const data = await response.json();
      console.log("Agent started:", data);
    } catch (error) {
      console.error("Failed to start agent:", error);
      // Update status to error
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === agentId ? { ...agent, status: "error" as const } : agent
        )
      );
    }
  };

  const handleStopAgent = async (agentId: string) => {
    try {
      const response = await fetch("/api/agents/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to stop agent");
      }

      // Update agent status to stopped
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === agentId ? { ...agent, status: "stopped" as const } : agent
        )
      );
    } catch (error) {
      console.error("Failed to stop agent:", error);
      // Update status to error
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === agentId ? { ...agent, status: "error" as const } : agent
        )
      );
    }
  };

  const getStatusBadge = (status: Agent["status"]) => {
    switch (status) {
      case "running":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Running</Badge>
        );
      case "stopped":
        return <Badge variant="secondary">Stopped</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Test Agents</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {agent.description}
                    </p>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>

                <div className="flex gap-2">
                  {agent.status === "stopped" || agent.status === "error" ? (
                    <Button
                      size="sm"
                      onClick={() => handleStartClick(agent.id)}
                      className="w-full"
                    >
                      Start
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStopAgent(agent.id)}
                      className="w-full"
                    >
                      Stop
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedAgent && (
        <AgentConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          agentName={
            agents.find((a) => a.id === selectedAgent)?.name || "Agent"
          }
          onStart={handleStartAgent}
        />
      )}
    </>
  );
}
