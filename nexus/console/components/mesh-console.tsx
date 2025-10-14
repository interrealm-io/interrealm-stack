'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { RealmTree } from './realm-tree';
import { RealmDetails } from './realm-details';
import { CreateRealmDialog } from './create-realm-dialog';
import { realmApi } from '@/lib/api';
import type { Realm } from '@/lib/types';

export function MeshConsole() {
  const [realms, setRealms] = useState<Realm[]>([]);
  const [selectedRealmId, setSelectedRealmId] = useState<string | null>(null);
  const [createRealmOpen, setCreateRealmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRealms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await realmApi.getAll();
      setRealms(data);

      // Auto-select first realm if none selected
      if (!selectedRealmId && data.length > 0) {
        setSelectedRealmId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load realms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealms();
  }, []);

  const handleRealmCreated = (realm: Realm) => {
    loadRealms();
    setSelectedRealmId(realm.id);
  };

  const selectedRealm = realms.find((r) => r.id === selectedRealmId);

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Left Sidebar - Realm Tree */}
        <div className="flex w-80 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
            <h2 className="font-semibold text-foreground">Realm Hierarchy</h2>
            <Button size="sm" variant="ghost" onClick={() => setCreateRealmOpen(true)} className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Loading realms...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <p className="text-sm text-destructive text-center mb-4">{error}</p>
                <Button size="sm" variant="outline" onClick={loadRealms}>
                  Retry
                </Button>
              </div>
            ) : realms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  No realms yet. Create your first realm to get started.
                </p>
                <Button size="sm" onClick={() => setCreateRealmOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Realm
                </Button>
              </div>
            ) : (
              <RealmTree realms={realms} selectedRealmId={selectedRealmId} onSelectRealm={setSelectedRealmId} />
            )}
          </div>
        </div>

        {/* Main Content - Realm Details */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {selectedRealm ? (
            <RealmDetails realm={selectedRealm} onRefresh={loadRealms} />
          ) : (
            <div className="flex h-full items-center justify-center bg-background">
              <div className="text-center space-y-4">
                <p className="text-lg text-muted-foreground">Select a realm to view details</p>
                {realms.length === 0 && (
                  <Button onClick={() => setCreateRealmOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Realm
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateRealmDialog
        open={createRealmOpen}
        onOpenChange={setCreateRealmOpen}
        onRealmCreated={handleRealmCreated}
        existingRealms={realms}
      />
    </>
  );
}
