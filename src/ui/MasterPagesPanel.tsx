// Master Pages Panel - manage master pages and apply them to pages
import React, { useState } from 'react';
import { store, useStore } from '../document/store';

interface MasterPagesPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const MasterPagesPanel: React.FC<MasterPagesPanelProps> = ({ visible, onClose }) => {
  const state = useStore();
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterType, setNewMasterType] = useState<'left' | 'right' | 'single'>('single');

  if (!visible) return null;

  const handleCreateMaster = () => {
    if (newMasterName.trim()) {
      store.createMasterPage(newMasterName.trim(), newMasterType);
      setNewMasterName('');
    }
  };

  const handleDeleteMaster = () => {
    if (selectedMasterId) {
      store.deleteMasterPage(selectedMasterId);
      setSelectedMasterId(null);
    }
  };

  const handleApplyToCurrentPage = () => {
    if (selectedMasterId) {
      store.applyMasterPageToPage(state.currentPageIndex, selectedMasterId);
    }
  };

  const handleRemoveFromCurrentPage = () => {
    store.applyMasterPageToPage(state.currentPageIndex, null);
  };

  const currentPage = state.document.pages[state.currentPageIndex];
  const currentMasterPage = currentPage?.masterPageId
    ? state.document.masterPages.find(mp => mp.id === currentPage.masterPageId)
    : null;

  return (
    <div
      className="fm-master-pages-panel"
      style={{
        position: 'fixed',
        top: 100,
        right: 20,
        width: 350,
        backgroundColor: '#c0c0c0',
        border: '2px solid',
        borderColor: '#ffffff #000000 #000000 #ffffff',
        boxShadow: '2px 2px 0 rgba(0,0,0,0.2)',
        zIndex: 1000,
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
        <span>Master Pages</span>
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
      <div style={{ padding: 8 }}>
        {/* Current page info */}
        <div
          style={{
            marginBottom: 8,
            padding: 6,
            backgroundColor: '#ffffff',
            border: '1px solid',
            borderColor: '#808080 #ffffff #ffffff #808080',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            Current Page: {state.currentPageIndex + 1}
          </div>
          <div>
            Master Page: {currentMasterPage ? currentMasterPage.name : 'None'}
          </div>
        </div>

        {/* Master pages list */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            Available Master Pages:
          </label>
          <select
            size={5}
            value={selectedMasterId || ''}
            onChange={(e) => setSelectedMasterId(e.target.value || null)}
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid',
              borderColor: '#808080 #ffffff #ffffff #808080',
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: '11px',
            }}
          >
            {state.document.masterPages.map((master) => (
              <option key={master.id} value={master.id}>
                {master.name} ({master.pageType})
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <button
            onClick={handleApplyToCurrentPage}
            disabled={!selectedMasterId}
            style={{
              flex: 1,
              padding: '4px 8px',
              backgroundColor: '#c0c0c0',
              border: '2px solid',
              borderColor: '#ffffff #000000 #000000 #ffffff',
              cursor: selectedMasterId ? 'pointer' : 'not-allowed',
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: '11px',
            }}
          >
            Apply to Page
          </button>
          <button
            onClick={handleRemoveFromCurrentPage}
            disabled={!currentMasterPage}
            style={{
              flex: 1,
              padding: '4px 8px',
              backgroundColor: '#c0c0c0',
              border: '2px solid',
              borderColor: '#ffffff #000000 #000000 #ffffff',
              cursor: currentMasterPage ? 'pointer' : 'not-allowed',
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: '11px',
            }}
          >
            Remove
          </button>
        </div>

        {/* Create new master */}
        <div
          style={{
            marginBottom: 8,
            padding: 6,
            backgroundColor: '#ffffff',
            border: '1px solid',
            borderColor: '#808080 #ffffff #ffffff #808080',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Create New Master:</div>
          <div style={{ marginBottom: 4 }}>
            <label style={{ display: 'block', marginBottom: 2 }}>Name:</label>
            <input
              type="text"
              value={newMasterName}
              onChange={(e) => setNewMasterName(e.target.value)}
              placeholder="e.g., Chapter Page"
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
              value={newMasterType}
              onChange={(e) => setNewMasterType(e.target.value as 'left' | 'right' | 'single')}
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
              <option value="single">Single</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <button
            onClick={handleCreateMaster}
            disabled={!newMasterName.trim()}
            style={{
              width: '100%',
              padding: '4px 8px',
              backgroundColor: '#c0c0c0',
              border: '2px solid',
              borderColor: '#ffffff #000000 #000000 #ffffff',
              cursor: newMasterName.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'MS Sans Serif, Arial, sans-serif',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            Create
          </button>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDeleteMaster}
          disabled={!selectedMasterId}
          style={{
            width: '100%',
            padding: '4px 8px',
            backgroundColor: '#c0c0c0',
            border: '2px solid',
            borderColor: '#ffffff #000000 #000000 #ffffff',
            cursor: selectedMasterId ? 'pointer' : 'not-allowed',
            fontFamily: 'MS Sans Serif, Arial, sans-serif',
            fontSize: '11px',
          }}
        >
          Delete Master Page
        </button>

        {/* Info */}
        <div
          style={{
            marginTop: 8,
            padding: 6,
            backgroundColor: '#ffffcc',
            border: '1px solid #808080',
            fontSize: '10px',
          }}
        >
          <strong>Note:</strong> Master pages define template layouts for document pages.
          Background frames and template text frames will appear on all pages using this master.
        </div>
      </div>
    </div>
  );
};
