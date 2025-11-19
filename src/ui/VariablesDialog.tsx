// Variables Dialog - insert and manage document variables
import React, { useState } from 'react';
import { store, useStore } from '../document/store';
import type { VariableType } from '../document/types';

interface VariablesDialogProps {
  visible: boolean;
  onClose: () => void;
}

export const VariablesDialog: React.FC<VariablesDialogProps> = ({ visible, onClose }) => {
  const state = useStore();
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<VariableType>('custom');
  const [newVarValue, setNewVarValue] = useState('');

  if (!visible) return null;

  const handleInsert = () => {
    if (selectedVariable) {
      store.insertVariable(selectedVariable);
      onClose();
    }
  };

  const handleCreate = () => {
    if (newVarName.trim()) {
      store.createVariable(
        newVarName.trim(),
        newVarType,
        undefined,
        newVarType === 'custom' ? newVarValue : undefined
      );
      setNewVarName('');
      setNewVarValue('');
      setNewVarType('custom');
    }
  };

  const handleDelete = () => {
    if (selectedVariable) {
      if (confirm(`Delete variable "${selectedVariable}"?`)) {
        store.deleteVariable(selectedVariable);
        setSelectedVariable(null);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        backgroundColor: '#c0c0c0',
        border: '2px solid',
        borderColor: '#ffffff #000000 #000000 #ffffff',
        boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
        zIndex: 2000,
        fontFamily: 'MS Sans Serif, Arial, sans-serif',
        fontSize: '11px',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: 'linear-gradient(to right, #000080, #1084d0)',
          color: 'white',
          padding: '2px 4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold',
        }}
      >
        <span>Variables</span>
        <button
          onClick={onClose}
          style={{
            background: '#c0c0c0',
            border: '1px solid',
            borderColor: '#ffffff #000000 #000000 #ffffff',
            width: 16,
            height: 14,
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            Available Variables:
          </label>
          <select
            size={8}
            value={selectedVariable || ''}
            onChange={(e) => setSelectedVariable(e.target.value || null)}
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid',
              borderColor: '#808080 #ffffff #ffffff #808080',
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: '11px',
            }}
          >
            {state.document.variables.map((variable) => (
              <option key={variable.name} value={variable.name}>
                {variable.name} ({variable.type})
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons for existing variables */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={handleInsert}
            disabled={!selectedVariable || !state.editingFrameId}
            style={{
              flex: 1,
              padding: '6px 12px',
              backgroundColor: '#c0c0c0',
              border: '2px solid',
              borderColor: '#ffffff #000000 #000000 #ffffff',
              cursor: selectedVariable && state.editingFrameId ? 'pointer' : 'not-allowed',
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            Insert
          </button>
          <button
            onClick={handleDelete}
            disabled={!selectedVariable}
            style={{
              flex: 1,
              padding: '6px 12px',
              backgroundColor: '#c0c0c0',
              border: '2px solid',
              borderColor: '#ffffff #000000 #000000 #ffffff',
              cursor: selectedVariable ? 'pointer' : 'not-allowed',
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: '11px',
            }}
          >
            Delete
          </button>
        </div>

        {/* Separator */}
        <div
          style={{
            borderTop: '1px solid #808080',
            borderBottom: '1px solid #ffffff',
            margin: '12px 0',
          }}
        />

        {/* Create new variable */}
        <div
          style={{
            padding: 8,
            backgroundColor: '#ffffff',
            border: '1px solid',
            borderColor: '#808080 #ffffff #ffffff #808080',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Create New Variable:</div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'block', marginBottom: 2 }}>Name:</label>
            <input
              type="text"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              placeholder="e.g., Custom Header"
              style={{
                width: '100%',
                padding: 2,
                border: '1px solid',
                borderColor: '#808080 #ffffff #ffffff #808080',
                fontFamily: 'MS Sans Serif, Arial, sans-serif',
                fontSize: '11px',
              }}
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'block', marginBottom: 2 }}>Type:</label>
            <select
              value={newVarType}
              onChange={(e) => setNewVarType(e.target.value as VariableType)}
              style={{
                width: '100%',
                padding: 2,
                backgroundColor: '#ffffff',
                border: '1px solid',
                borderColor: '#808080 #ffffff #ffffff #808080',
                fontFamily: 'MS Sans Serif, Arial, sans-serif',
                fontSize: '11px',
              }}
            >
              <option value="custom">Custom</option>
              <option value="currentPageNumber">Current Page Number</option>
              <option value="pageCount">Page Count</option>
              <option value="runningHeader">Running Header</option>
              <option value="runningFooter">Running Footer</option>
              <option value="chapterNumber">Chapter Number</option>
              <option value="chapterTitle">Chapter Title</option>
              <option value="creationDate">Creation Date</option>
              <option value="modificationDate">Modification Date</option>
              <option value="filename">Filename</option>
              <option value="author">Author</option>
            </select>
          </div>

          {newVarType === 'custom' && (
            <div style={{ marginBottom: 6 }}>
              <label style={{ display: 'block', marginBottom: 2 }}>Value:</label>
              <input
                type="text"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                placeholder="Custom value"
                style={{
                  width: '100%',
                  padding: 2,
                  border: '1px solid',
                  borderColor: '#808080 #ffffff #ffffff #808080',
                  fontFamily: 'MS Sans Serif, Arial, sans-serif',
                  fontSize: '11px',
                }}
              />
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={!newVarName.trim()}
            style={{
              width: '100%',
              padding: '6px 12px',
              backgroundColor: '#c0c0c0',
              border: '2px solid',
              borderColor: '#ffffff #000000 #000000 #ffffff',
              cursor: newVarName.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: '11px',
              fontWeight: 'bold',
              marginTop: 8,
            }}
          >
            Create
          </button>
        </div>

        {/* Info */}
        <div
          style={{
            marginTop: 12,
            padding: 6,
            backgroundColor: '#ffffcc',
            border: '1px solid #808080',
            fontSize: '10px',
          }}
        >
          <strong>Note:</strong> Variables display dynamic content like page numbers, dates, and
          custom text. Select a variable and click Insert to add it at the cursor position.
        </div>
      </div>
    </div>
  );
};
