'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { memberApi } from '@/lib/api';
import type { Member, MemberType } from '@/lib/types';
import { Copy, Check } from 'lucide-react';

interface CreateMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberCreated: (member: Member) => void;
  realmId: string;
}

export function CreateMemberDialog({ open, onOpenChange, onMemberCreated, realmId }: CreateMemberDialogProps) {
  const [name, setName] = useState('');
  const [memberType, setMemberType] = useState<MemberType>('hybrid');
  const [contractName, setContractName] = useState('');
  const [contractVersion, setContractVersion] = useState('1.0.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setMemberType('hybrid');
      setContractName('');
      setContractVersion('1.0.0');
      setError(null);
      setApiKey(null);
      setCopied(false);
    }
  }, [open]);

  const handleCreate = async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Member name is required');
      return;
    }

    setLoading(true);

    try {
      const result = await memberApi.create({
        name,
        realmId,
        memberType,
        contractName: contractName.trim() || undefined,
        contractVersion: contractVersion.trim() || undefined,
        metadata: {},
      });

      // Show API key if returned
      if (result.apiKey) {
        setApiKey(result.apiKey);
      } else {
        // If no API key returned, close dialog and notify parent
        onMemberCreated(result);
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDone = () => {
    if (apiKey) {
      // Notify parent that member was created
      onMemberCreated({
        id: '', // The actual member object will be refreshed from the API
        name,
        realmId,
        memberType,
        contractName,
        contractVersion,
        authType: 'api-key',
        authConfig: {},
        status: 'offline',
        metadata: {},
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Member</DialogTitle>
          <DialogDescription>
            Create a new member (SDK client) for this realm. Members connect to the mesh via the SDK.
          </DialogDescription>
        </DialogHeader>

        {!apiKey ? (
          <>
            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Member Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., My Agent Runtime"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Descriptive name for this member
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberType">Member Type</Label>
                <Select value={memberType} onValueChange={(value) => setMemberType(value as MemberType)} disabled={loading}>
                  <SelectTrigger id="memberType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consumer">Consumer</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="agent-runtime">Agent Runtime</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Consumer + Provider)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Role of this member in the mesh
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractName">Contract Name (optional)</Label>
                <Input
                  id="contractName"
                  placeholder="e.g., agent.assistant"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Service contract this member implements
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractVersion">Contract Version (optional)</Label>
                <Input
                  id="contractVersion"
                  placeholder="e.g., 1.0.0"
                  value={contractVersion}
                  onChange={(e) => setContractVersion(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Version of the contract
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create Member'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border-2 border-warning bg-warning/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning text-warning-foreground">
                    !
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-foreground">Save this API key - it won't be shown again!</h3>
                    <p className="text-sm text-muted-foreground">
                      Copy this API key and store it securely. You'll need it to connect your SDK client to the mesh.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={apiKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyApiKey}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-semibold text-sm">Next Steps:</h4>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Copy the API key above and save it securely</li>
                  <li>Use the API key in your SDK client configuration</li>
                  <li>Connect your client to the gateway at ws://localhost:3000</li>
                  <li>View connection status in the Nexus Console</li>
                </ol>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleDone}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
