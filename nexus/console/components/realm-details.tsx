'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Circle, Clock, Settings } from 'lucide-react';
import { CreateMemberDialog } from './create-member-dialog';
import { memberApi } from '@/lib/api';
import type { Realm, Member, MemberStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RealmDetailsProps {
  realm: Realm;
  onRefresh?: () => void;
}

const getMemberStatusColor = (status: MemberStatus): string => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'offline':
      return 'bg-gray-400';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

const getMemberTypeColor = (type: string): string => {
  switch (type) {
    case 'consumer':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'provider':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'agent-runtime':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'hybrid':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

export function RealmDetails({ realm, onRefresh }: RealmDetailsProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createMemberOpen, setCreateMemberOpen] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await memberApi.getAll(realm.id);
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [realm.id]);

  const handleMemberCreated = (member: Member) => {
    loadMembers();
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      <div className="flex h-full flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{realm.displayName}</h2>
                <Badge variant="outline" className="capitalize">
                  {realm.realmType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Realm ID: {realm.realmId}</p>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Realm Info */}
            <Card>
              <CardHeader>
                <CardTitle>Realm Information</CardTitle>
                <CardDescription>Configuration and policies for this realm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Realm Type</p>
                    <p className="mt-1 text-sm capitalize">{realm.realmType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Parent Realm</p>
                    <p className="mt-1 text-sm">{realm.parentId || 'None (Root)'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inherit Policies</p>
                    <p className="mt-1 text-sm">{realm.inheritPolicies ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Members</p>
                    <p className="mt-1 text-sm">{members.length}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Policies</p>
                  <div className="space-y-1">
                    {realm.policies.map((policy, idx) => (
                      <div key={idx} className="rounded bg-muted px-3 py-1.5 font-mono text-xs">
                        {policy}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>SDK clients connected to this realm</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setCreateMemberOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">Loading members...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                ) : members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm text-muted-foreground mb-4">No members yet</p>
                    <Button size="sm" variant="outline" onClick={() => setCreateMemberOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                      >
                        <div className={cn('h-3 w-3 shrink-0 rounded-full', getMemberStatusColor(member.status))} />

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{member.name}</p>
                            <Badge variant="outline" className={cn('text-xs capitalize', getMemberTypeColor(member.memberType))}>
                              {member.memberType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>ID: {member.id}</span>
                            {member.contractName && (
                              <span>Contract: {member.contractName}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Circle className={cn('h-2 w-2', member.status === 'online' ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400')} />
                          <span className="capitalize">{member.status}</span>
                        </div>

                        {member.lastConnected && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(member.lastConnected).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      <CreateMemberDialog
        open={createMemberOpen}
        onOpenChange={setCreateMemberOpen}
        onMemberCreated={handleMemberCreated}
        realmId={realm.id}
      />
    </>
  );
}
