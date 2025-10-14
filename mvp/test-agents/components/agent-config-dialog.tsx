"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AgentConfig {
  endpoint: string;
  apiKey: string;
  realmId?: string;
}

interface AgentConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  onStart: (config: AgentConfig) => void;
}

export function AgentConfigDialog({
  open,
  onOpenChange,
  agentName,
  onStart,
}: AgentConfigDialogProps) {
  const [config, setConfig] = useState<AgentConfig>({
    endpoint: "ws://localhost:3001/gateway",
    apiKey: "",
    realmId: "",
  });

  const handleStart = () => {
    onStart(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure {agentName}</DialogTitle>
          <DialogDescription>
            Enter the gateway connection details to start this agent.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="endpoint">Gateway Endpoint</Label>
            <Input
              id="endpoint"
              placeholder="ws://localhost:3001/gateway"
              value={config.endpoint}
              onChange={(e) =>
                setConfig({ ...config, endpoint: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={config.apiKey}
              onChange={(e) =>
                setConfig({ ...config, apiKey: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="realmId">Realm ID (Optional)</Label>
            <Input
              id="realmId"
              placeholder="Enter realm ID"
              value={config.realmId}
              onChange={(e) =>
                setConfig({ ...config, realmId: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              If not provided, the API key will resolve the realm
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={!config.apiKey}>
            Start Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
