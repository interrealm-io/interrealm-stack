import { useState } from 'react';
import { Policy } from '../types';
import './PolicyEditor.css';

interface PolicyEditorProps {
  policy?: Policy;
  onSave: (policy: Partial<Policy>) => void;
  onCancel: () => void;
}

export function PolicyEditor({ policy, onSave, onCancel }: PolicyEditorProps) {
  const [formData, setFormData] = useState<Partial<Policy>>({
    name: policy?.name || '',
    description: policy?.description || '',
    type: policy?.type || 'capability-access',
    config: policy?.config || {},
  });

  const [configJson, setConfigJson] = useState<string>(
    JSON.stringify(policy?.config || {}, null, 2)
  );
  const [jsonError, setJsonError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSON config
    try {
      const parsedConfig = JSON.parse(configJson);
      const policyData = { ...formData, config: parsedConfig };
      onSave(policyData);
    } catch (err) {
      setJsonError('Invalid JSON configuration');
    }
  };

  const handleChange = (field: keyof Policy, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfigChange = (value: string) => {
    setConfigJson(value);
    setJsonError('');

    // Try to parse and update formData
    try {
      const parsed = JSON.parse(value);
      setFormData(prev => ({ ...prev, config: parsed }));
    } catch (err) {
      // Invalid JSON, don't update formData yet
    }
  };

  const getPolicyConfigTemplate = (type: Policy['type']) => {
    switch (type) {
      case 'capability-access':
        return {
          allowedCapabilities: ['*'],
          deniedCapabilities: [],
          requireAuthentication: true,
        };
      case 'rate-limit':
        return {
          requestsPerMinute: 100,
          burstSize: 20,
          keyBy: 'memberId',
        };
      case 'audit':
        return {
          logLevel: 'info',
          includePayload: false,
          retention: '30d',
        };
      case 'authentication':
        return {
          methods: ['api-key', 'jwt'],
          required: true,
        };
      case 'authorization':
        return {
          roles: ['user', 'admin'],
          defaultRole: 'user',
        };
      default:
        return {};
    }
  };

  const handleTypeChange = (type: Policy['type']) => {
    handleChange('type', type);
    const template = getPolicyConfigTemplate(type);
    setConfigJson(JSON.stringify(template, null, 2));
    setFormData(prev => ({ ...prev, config: template }));
  };

  return (
    <div className="policy-editor">
      <h3>{policy ? 'Edit Policy' : 'Create New Policy'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Policy Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="rate-limit-default"
            required
            disabled={!!policy} // Can't change name of existing policy
          />
          <span className="hint">Unique identifier for this policy</span>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Default rate limiting policy for all realms"
          />
          <span className="hint">Human-readable description</span>
        </div>

        <div className="form-group">
          <label htmlFor="type">Policy Type *</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleTypeChange(e.target.value as Policy['type'])}
            required
          >
            <option value="capability-access">Capability Access</option>
            <option value="rate-limit">Rate Limit</option>
            <option value="audit">Audit</option>
            <option value="authentication">Authentication</option>
            <option value="authorization">Authorization</option>
            <option value="data-governance">Data Governance</option>
            <option value="custom">Custom</option>
          </select>
          <span className="hint">Type determines policy behavior</span>
        </div>

        <div className="form-group">
          <label htmlFor="config">Policy Configuration (JSON) *</label>
          <textarea
            id="config"
            value={configJson}
            onChange={(e) => handleConfigChange(e.target.value)}
            rows={12}
            placeholder="{}"
            className={jsonError ? 'error' : ''}
            required
          />
          {jsonError && <span className="error-text">{jsonError}</span>}
          <span className="hint">JSON configuration specific to policy type</span>
        </div>

        <div className="policy-examples">
          <details>
            <summary>Policy Configuration Examples</summary>
            <div className="examples-content">
              <h4>Capability Access</h4>
              <pre>{JSON.stringify(getPolicyConfigTemplate('capability-access'), null, 2)}</pre>

              <h4>Rate Limit</h4>
              <pre>{JSON.stringify(getPolicyConfigTemplate('rate-limit'), null, 2)}</pre>

              <h4>Audit</h4>
              <pre>{JSON.stringify(getPolicyConfigTemplate('audit'), null, 2)}</pre>
            </div>
          </details>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {policy ? 'Update Policy' : 'Create Policy'}
          </button>
        </div>
      </form>
    </div>
  );
}
