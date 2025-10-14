'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Circle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Realm, RealmTreeNode, RealmType, RealmStatus } from '@/lib/types';

interface RealmTreeProps {
  realms: Realm[];
  selectedRealmId: string | null;
  onSelectRealm: (id: string) => void;
}

const getRealmTypeColor = (type: RealmType): string => {
  switch (type) {
    case 'root':
      return 'text-purple-500';
    case 'organization':
      return 'text-blue-500';
    case 'tenant':
      return 'text-green-500';
    case 'department':
      return 'text-yellow-500';
    case 'service':
      return 'text-orange-500';
    case 'user':
      return 'text-pink-500';
    default:
      return 'text-muted-foreground';
  }
};

const getRealmTypeIcon = (type: RealmType): string => {
  switch (type) {
    case 'root':
      return '🏰';
    case 'organization':
      return '🏢';
    case 'tenant':
      return '🏠';
    case 'department':
      return '📁';
    case 'service':
      return '⚙️';
    case 'user':
      return '👤';
    default:
      return '📦';
  }
};

const getStatusColor = (status?: RealmStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'inactive':
      return 'bg-gray-400';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

export function RealmTree({ realms, selectedRealmId, onSelectRealm }: RealmTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure
  const buildTree = (): RealmTreeNode[] => {
    const realmMap = new Map<string, Realm>();
    const childrenMap = new Map<string, string[]>();

    // First pass: create maps
    realms.forEach((realm) => {
      realmMap.set(realm.id, realm);
      const parentId = realm.parentId || 'root';
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(realm.id);
    });

    // Second pass: build tree nodes
    const treeNodes: RealmTreeNode[] = [];

    const buildNode = (realm: Realm): RealmTreeNode => {
      const children = childrenMap.get(realm.id) || [];
      return {
        id: realm.id,
        realmId: realm.realmId,
        displayName: realm.displayName,
        realmType: realm.realmType,
        parentId: realm.parentId,
        children,
        memberCount: realm.members?.length || 0,
      };
    };

    // Get root realms (no parent)
    const rootRealms = realms.filter((r) => !r.parentId);
    rootRealms.forEach((realm) => {
      treeNodes.push(buildNode(realm));
    });

    return treeNodes;
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderNode = (node: RealmTreeNode, depth = 0): JSX.Element => {
    const realm = realms.find((r) => r.id === node.id);
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedRealmId === node.id;

    return (
      <div key={node.id}>
        <button
          onClick={() => onSelectRealm(node.id)}
          className={cn(
            'group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-all',
            isSelected
              ? 'bg-primary/15 text-foreground shadow-sm ring-1 ring-primary/20'
              : 'text-foreground hover:bg-accent/50'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <div className={cn('h-2 w-2 shrink-0 rounded-full', getStatusColor('active'))} />

          <span className="text-base">{getRealmTypeIcon(node.realmType)}</span>

          <span className="flex-1 truncate font-medium">{node.displayName}</span>

          {node.memberCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{node.memberCount}</span>
            </div>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {node.children.map((childId) => {
              const childRealm = realms.find((r) => r.id === childId);
              if (!childRealm) return null;
              const childNode: RealmTreeNode = {
                id: childRealm.id,
                realmId: childRealm.realmId,
                displayName: childRealm.displayName,
                realmType: childRealm.realmType,
                parentId: childRealm.parentId,
                children: realms.filter((r) => r.parentId === childId).map((r) => r.id),
                memberCount: childRealm.members?.length || 0,
              };
              return renderNode(childNode, depth + 1);
            })}
          </div>
        )}
      </div>
    );
  };

  const treeNodes = buildTree();

  if (treeNodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">No realms yet</p>
          <p className="text-xs text-muted-foreground">Create your first realm to get started</p>
        </div>
      </div>
    );
  }

  return <div className="space-y-1">{treeNodes.map((node) => renderNode(node))}</div>;
}
