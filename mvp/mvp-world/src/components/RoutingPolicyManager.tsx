import { useState } from 'react';
import { Route, Policy } from '../types';
import { RouteEditor } from './RouteEditor';
import { PolicyEditor } from './PolicyEditor';
import './RoutingPolicyManager.css';

export function RoutingPolicyManager() {
  const [activeTab, setActiveTab] = useState<'routes' | 'policies'>('routes');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [showRouteEditor, setShowRouteEditor] = useState(false);
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);

  // Route handlers
  const handleSaveRoute = (routeData: Partial<Route>) => {
    if (editingRoute) {
      // Update existing route
      setRoutes(routes.map(r =>
        r.id === editingRoute.id
          ? { ...r, ...routeData, updatedAt: new Date().toISOString() }
          : r
      ));
    } else {
      // Create new route
      const newRoute: Route = {
        id: crypto.randomUUID(),
        routePattern: routeData.routePattern!,
        capability: routeData.capability!,
        operation: routeData.operation,
        targetRealmId: routeData.targetRealmId!,
        targetMemberId: routeData.targetMemberId,
        priority: routeData.priority || 0,
        active: routeData.active ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRoutes([...routes, newRoute]);
    }
    setShowRouteEditor(false);
    setEditingRoute(null);
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setShowRouteEditor(true);
  };

  const handleDeleteRoute = (routeId: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      setRoutes(routes.filter(r => r.id !== routeId));
    }
  };

  const handleToggleRoute = (routeId: string) => {
    setRoutes(routes.map(r =>
      r.id === routeId
        ? { ...r, active: !r.active, updatedAt: new Date().toISOString() }
        : r
    ));
  };

  // Policy handlers
  const handleSavePolicy = (policyData: Partial<Policy>) => {
    if (editingPolicy) {
      // Update existing policy
      setPolicies(policies.map(p =>
        p.name === editingPolicy.name
          ? { ...p, ...policyData, updatedAt: new Date().toISOString() }
          : p
      ));
    } else {
      // Create new policy
      const newPolicy: Policy = {
        name: policyData.name!,
        description: policyData.description,
        type: policyData.type!,
        config: policyData.config || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPolicies([...policies, newPolicy]);
    }
    setShowPolicyEditor(false);
    setEditingPolicy(null);
  };

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setShowPolicyEditor(true);
  };

  const handleDeletePolicy = (policyName: string) => {
    if (confirm('Are you sure you want to delete this policy?')) {
      setPolicies(policies.filter(p => p.name !== policyName));
    }
  };

  return (
    <div className="routing-policy-manager">
      <div className="manager-header">
        <h2>Routing & Policies</h2>
        <div className="tab-bar">
          <button
            className={`tab ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            Routes ({routes.length})
          </button>
          <button
            className={`tab ${activeTab === 'policies' ? 'active' : ''}`}
            onClick={() => setActiveTab('policies')}
          >
            Policies ({policies.length})
          </button>
        </div>
      </div>

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div className="routes-panel">
          <div className="panel-actions">
            <button
              className="btn-create"
              onClick={() => {
                setEditingRoute(null);
                setShowRouteEditor(true);
              }}
            >
              + Create Route
            </button>
          </div>

          {showRouteEditor && (
            <RouteEditor
              route={editingRoute || undefined}
              onSave={handleSaveRoute}
              onCancel={() => {
                setShowRouteEditor(false);
                setEditingRoute(null);
              }}
            />
          )}

          <div className="routes-list">
            {routes.length === 0 && !showRouteEditor && (
              <div className="empty-state">
                <p>No routes configured yet</p>
                <p className="hint">Create your first route to start routing requests</p>
              </div>
            )}
            {routes.map(route => (
              <div key={route.id} className={`route-card ${!route.active ? 'inactive' : ''}`}>
                <div className="route-header">
                  <div className="route-info">
                    <span className="route-pattern">{route.routePattern}</span>
                    <span className="route-capability">→ {route.capability}</span>
                    {route.operation && (
                      <span className="route-operation">.{route.operation}</span>
                    )}
                  </div>
                  <div className="route-status">
                    <span className="priority-badge">P{route.priority}</span>
                    <button
                      className={`toggle-btn ${route.active ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleRoute(route.id)}
                      title={route.active ? 'Deactivate' : 'Activate'}
                    >
                      {route.active ? '●' : '○'}
                    </button>
                  </div>
                </div>
                <div className="route-details">
                  <div className="detail-item">
                    <span className="label">Target Realm:</span>
                    <span className="value">{route.targetRealmId}</span>
                  </div>
                  {route.targetMemberId && (
                    <div className="detail-item">
                      <span className="label">Target Member:</span>
                      <span className="value">{route.targetMemberId}</span>
                    </div>
                  )}
                </div>
                <div className="route-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEditRoute(route)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteRoute(route.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="policies-panel">
          <div className="panel-actions">
            <button
              className="btn-create"
              onClick={() => {
                setEditingPolicy(null);
                setShowPolicyEditor(true);
              }}
            >
              + Create Policy
            </button>
          </div>

          {showPolicyEditor && (
            <PolicyEditor
              policy={editingPolicy || undefined}
              onSave={handleSavePolicy}
              onCancel={() => {
                setShowPolicyEditor(false);
                setEditingPolicy(null);
              }}
            />
          )}

          <div className="policies-list">
            {policies.length === 0 && !showPolicyEditor && (
              <div className="empty-state">
                <p>No policies configured yet</p>
                <p className="hint">Create your first policy to control realm behavior</p>
              </div>
            )}
            {policies.map(policy => (
              <div key={policy.name} className="policy-card">
                <div className="policy-header">
                  <div className="policy-info">
                    <span className="policy-name">{policy.name}</span>
                    <span className="policy-type">{policy.type}</span>
                  </div>
                </div>
                {policy.description && (
                  <div className="policy-description">{policy.description}</div>
                )}
                <div className="policy-config">
                  <details>
                    <summary>Configuration</summary>
                    <pre>{JSON.stringify(policy.config, null, 2)}</pre>
                  </details>
                </div>
                <div className="policy-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEditPolicy(policy)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeletePolicy(policy.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
