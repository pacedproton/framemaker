import React, { useState } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import type { ConditionTag } from '../../types/document';
import { Filter, Plus, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';

const ConditionsPanel: React.FC = () => {
  const {
    currentDocument,
    addCondition,
    updateCondition,
    deleteCondition,
    toggleConditionVisibility,
  } = useDocumentStore();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newCondition, setNewCondition] = useState<ConditionTag>({
    name: '',
    color: '#ff0000',
    visible: true,
  });

  if (!currentDocument) {
    return (
      <div className="panel conditions-panel">
        <div className="panel-header">
          <h3>Conditions</h3>
        </div>
        <div className="panel-content empty">
          <p>No document open</p>
        </div>
      </div>
    );
  }

  const handleAddCondition = () => {
    if (!newCondition.name.trim()) return;
    addCondition(newCondition);
    setNewCondition({ name: '', color: '#ff0000', visible: true });
    setShowNewForm(false);
  };

  return (
    <div className="panel conditions-panel">
      <div className="panel-header">
        <h3>
          <Filter size={16} />
          Conditional Text
        </h3>
        <div className="panel-actions">
          <button
            className="panel-action-button"
            onClick={() => setShowNewForm(true)}
            title="Add New Condition"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="panel-content">
        {showNewForm && (
          <div className="new-condition-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Condition name"
                value={newCondition.name}
                onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input
                type="color"
                value={newCondition.color}
                onChange={(e) => setNewCondition({ ...newCondition, color: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button onClick={handleAddCondition}>Add</button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewCondition({ name: '', color: '#ff0000', visible: true });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="conditions-list">
          {currentDocument.conditions.map((condition) => (
            <div key={condition.name} className="condition-item">
              <div
                className="condition-color"
                style={{ backgroundColor: condition.color }}
              />
              <div className="condition-info">
                <div className="condition-name">{condition.name}</div>
              </div>
              <div className="condition-actions">
                <button
                  className={`condition-action-button ${condition.visible ? 'visible' : 'hidden'}`}
                  onClick={() => toggleConditionVisibility(condition.name)}
                  title={condition.visible ? 'Hide Condition' : 'Show Condition'}
                >
                  {condition.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  className="condition-action-button"
                  onClick={() => {
                    const newColor = prompt('Enter new color (hex)', condition.color);
                    if (newColor) {
                      updateCondition(condition.name, { color: newColor });
                    }
                  }}
                  title="Edit Color"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  className="condition-action-button delete"
                  onClick={() => deleteCondition(condition.name)}
                  title="Delete Condition"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="conditions-help">
          <h4>Using Conditional Text</h4>
          <p>
            Conditional text allows you to show or hide content based on output conditions. This is
            useful for:
          </p>
          <ul>
            <li>Single-source publishing (print vs. web)</li>
            <li>Different audience versions</li>
            <li>Draft vs. final content</li>
            <li>Platform-specific content</li>
          </ul>
          <p>
            <strong>To apply a condition:</strong> Select text and apply condition from the Format
            menu.
          </p>
          <p>
            <strong>To preview:</strong> Toggle condition visibility using the eye icon.
          </p>
        </div>

        <div className="condition-indicators">
          <h4>Condition Indicators</h4>
          <div className="indicator-options">
            <label>
              <input type="checkbox" defaultChecked />
              Show condition indicators
            </label>
            <label>
              <input type="checkbox" defaultChecked />
              Use condition colors
            </label>
            <label>
              <input type="checkbox" />
              Show as strikethrough when hidden
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionsPanel;
