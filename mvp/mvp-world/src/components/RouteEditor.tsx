import { useState } from 'react';
import { Route } from '../types';
import './RouteEditor.css';

interface RouteEditorProps {
  route?: Route;
  onSave: (route: Partial<Route>) => void;
  onCancel: () => void;
}

export function RouteEditor({ route, onSave, onCancel }: RouteEditorProps) {
  const [formData, setFormData] = useState<Partial<Route>>({
    routePattern: route?.routePattern || '',
    capability: route?.capability || '',
    operation: route?.operation || '',
    targetRealmId: route?.targetRealmId || '',
    targetMemberId: route?.targetMemberId || '',
    priority: route?.priority || 0,
    active: route?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof Route, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="route-editor">
      <h3>{route ? 'Edit Route' : 'Create New Route'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="routePattern">Route Pattern *</label>
          <input
            id="routePattern"
            type="text"
            value={formData.routePattern}
            onChange={(e) => handleChange('routePattern', e.target.value)}
            placeholder="/api/v1/users/*"
            required
          />
          <span className="hint">Pattern for matching requests</span>
        </div>

        <div className="form-group">
          <label htmlFor="capability">Capability *</label>
          <input
            id="capability"
            type="text"
            value={formData.capability}
            onChange={(e) => handleChange('capability', e.target.value)}
            placeholder="user-management"
            required
          />
          <span className="hint">Capability name to route to</span>
        </div>

        <div className="form-group">
          <label htmlFor="operation">Operation</label>
          <input
            id="operation"
            type="text"
            value={formData.operation || ''}
            onChange={(e) => handleChange('operation', e.target.value)}
            placeholder="create, read, update, delete"
          />
          <span className="hint">Specific operation within capability (optional)</span>
        </div>

        <div className="form-group">
          <label htmlFor="targetRealmId">Target Realm ID *</label>
          <input
            id="targetRealmId"
            type="text"
            value={formData.targetRealmId}
            onChange={(e) => handleChange('targetRealmId', e.target.value)}
            placeholder="realm-uuid-here"
            required
          />
          <span className="hint">UUID of the target realm</span>
        </div>

        <div className="form-group">
          <label htmlFor="targetMemberId">Target Member ID</label>
          <input
            id="targetMemberId"
            type="text"
            value={formData.targetMemberId || ''}
            onChange={(e) => handleChange('targetMemberId', e.target.value)}
            placeholder="member-id (optional)"
          />
          <span className="hint">Specific member to route to (optional)</span>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) => handleChange('priority', parseInt(e.target.value))}
            min="0"
            max="100"
          />
          <span className="hint">Higher priority routes are matched first (0-100)</span>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => handleChange('active', e.target.checked)}
            />
            <span>Active</span>
          </label>
          <span className="hint">Route is only used when active</span>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {route ? 'Update Route' : 'Create Route'}
          </button>
        </div>
      </form>
    </div>
  );
}
