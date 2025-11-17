import React, { useState } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import type { VariableDefinition } from '../../types/document';
import { Variable, Plus, Edit2, Trash2, Copy } from 'lucide-react';

const VariablesPanel: React.FC = () => {
  const { currentDocument, addVariable, updateVariable, deleteVariable } = useDocumentStore();

  const [showNewForm, setShowNewForm] = useState(false);
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [newVariable, setNewVariable] = useState<VariableDefinition>({
    name: '',
    value: '',
    type: 'text',
  });

  if (!currentDocument) {
    return (
      <div className="panel variables-panel">
        <div className="panel-header">
          <h3>Variables</h3>
        </div>
        <div className="panel-content empty">
          <p>No document open</p>
        </div>
      </div>
    );
  }

  const handleAddVariable = () => {
    if (!newVariable.name.trim()) return;
    addVariable(newVariable);
    setNewVariable({ name: '', value: '', type: 'text' });
    setShowNewForm(false);
  };

  const handleCopyToClipboard = (name: string) => {
    navigator.clipboard.writeText(`<$${name}>`);
  };

  return (
    <div className="panel variables-panel">
      <div className="panel-header">
        <h3>
          <Variable size={16} />
          Variables
        </h3>
        <div className="panel-actions">
          <button
            className="panel-action-button"
            onClick={() => setShowNewForm(true)}
            title="Add New Variable"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="panel-content">
        {showNewForm && (
          <div className="new-variable-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="VariableName"
                value={newVariable.name}
                onChange={(e) =>
                  setNewVariable({ ...newVariable, name: e.target.value.replace(/\s/g, '') })
                }
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={newVariable.type}
                onChange={(e) =>
                  setNewVariable({
                    ...newVariable,
                    type: e.target.value as 'text' | 'date' | 'page' | 'custom',
                  })
                }
              >
                <option value="text">Text</option>
                <option value="date">Date</option>
                <option value="page">Page Number</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="form-group">
              <label>Value</label>
              <input
                type="text"
                placeholder="Variable value"
                value={newVariable.value}
                onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button onClick={handleAddVariable}>Add</button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewVariable({ name: '', value: '', type: 'text' });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="variables-list">
          {currentDocument.variables.map((variable) => (
            <div key={variable.name} className="variable-item">
              <div className="variable-info">
                <div className="variable-name">&lt;${variable.name}&gt;</div>
                <div className="variable-type">{variable.type}</div>
              </div>

              {editingVariable === variable.name ? (
                <div className="variable-edit">
                  <input
                    type="text"
                    value={variable.value}
                    onChange={(e) => updateVariable(variable.name, e.target.value)}
                    onBlur={() => setEditingVariable(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        setEditingVariable(null);
                      }
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="variable-value">{variable.value}</div>
              )}

              <div className="variable-actions">
                <button
                  className="variable-action-button"
                  onClick={() => handleCopyToClipboard(variable.name)}
                  title="Copy Variable Reference"
                >
                  <Copy size={12} />
                </button>
                <button
                  className="variable-action-button"
                  onClick={() => setEditingVariable(variable.name)}
                  title="Edit Value"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  className="variable-action-button delete"
                  onClick={() => deleteVariable(variable.name)}
                  title="Delete Variable"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="variables-help">
          <h4>Using Variables</h4>
          <p>
            Insert variables in your document using the Variable button in the toolbar or by typing
            the variable syntax.
          </p>
          <p>
            <strong>System Variables:</strong>
          </p>
          <ul>
            <li>&lt;$CurrentDate&gt; - Current date</li>
            <li>&lt;$PageNumber&gt; - Current page</li>
            <li>&lt;$TotalPages&gt; - Total pages</li>
            <li>&lt;$DocumentTitle&gt; - Document title</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VariablesPanel;
