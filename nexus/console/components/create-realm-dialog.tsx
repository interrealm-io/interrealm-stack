'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { realmApi } from '@/lib/api';
import type { Realm, RealmType } from '@/lib/types';

interface CreateRealmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRealmCreated: (realm: Realm) => void;
  existingRealms?: Realm[];
}

export function CreateRealmDialog({ open, onOpenChange, onRealmCreated, existingRealms = [] }: CreateRealmDialogProps) {
  const [realmId, setRealmId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [realmType, setRealmType] = useState<RealmType>('root');
  const [policies, setPolicies] = useState('allow:*');
  const [inheritPolicies, setInheritPolicies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setRealmId('');
      setDisplayName('');
      setParentId('');
      setRealmType('root');
      setPolicies('allow:*');
      setInheritPolicies(true);
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    setError(null);

    // Validation
    if (!realmId.trim()) {
      setError('Realm ID is required');
      return;
    }
    if (!displayName.trim()) {
      setError('Display Name is required');
      return;
    }

    setLoading(true);

    try {
      const policiesArray = policies
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const newRealm = await realmApi.create({
        realmId,
        displayName,
        parentId: parentId || null,
        realmType,
        policies: policiesArray.length > 0 ? policiesArray : ['allow:*'],
        inheritPolicies,
        metadata: {},
      });

      onRealmCreated(newRealm);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create realm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Realm</DialogTitle>
          <DialogDescription>
            Create a new realm in your mesh hierarchy. Root realms have no parent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="realmId">Realm ID</Label>
            <Input
              id="realmId"
              placeholder="e.g., production"
              value={realmId}
              onChange={(e) => setRealmId(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for this realm (alphanumeric, hyphens, underscores)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="e.g., Production Environment"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Human-readable name for display in the console
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="realmType">Realm Type</Label>
            <Select value={realmType} onValueChange={(value) => setRealmType(value as RealmType)} disabled={loading}>
              <SelectTrigger id="realmType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Organizational hierarchy level for this realm
            </p>
          </div>

          {existingRealms.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Realm (optional)</Label>
              <Select value={parentId} onValueChange={setParentId} disabled={loading}>
                <SelectTrigger id="parentId">
                  <SelectValue placeholder="None (Root Realm)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Root Realm)</SelectItem>
                  {existingRealms.map((realm) => (
                    <SelectItem key={realm.id} value={realm.id}>
                      {realm.displayName} ({realm.realmId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a parent realm to create a nested hierarchy
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="policies">Policies (one per line)</Label>
            <Textarea
              id="policies"
              placeholder="allow:*&#10;deny:admin.*"
              value={policies}
              onChange={(e) => setPolicies(e.target.value)}
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Access control policies for this realm (default: allow:*)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="inheritPolicies"
              checked={inheritPolicies}
              onChange={(e) => setInheritPolicies(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="inheritPolicies" className="font-normal">
              Inherit policies from parent realm
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Realm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
