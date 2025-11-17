// Main Toolbar - document operations and tools
import React from 'react';
import { store, useStore } from '../../document/store';

export const MainToolbar: React.FC = () => {
  const state = useStore();

  return (
    <div className="fm-main-toolbar">
      <div className="toolbar-group">
        <button
          className="toolbar-btn icon-btn"
          onClick={() => store.newDocument('Untitled')}
          title="New Document (Ctrl+N)"
        >
          <span className="btn-icon">📄</span>
        </button>
        <button className="toolbar-btn icon-btn" title="Open Document (Ctrl+O)">
          <span className="btn-icon">📂</span>
        </button>
        <button className="toolbar-btn icon-btn" title="Save Document (Ctrl+S)">
          <span className="btn-icon">💾</span>
        </button>
        <button className="toolbar-btn icon-btn" title="Print (Ctrl+P)">
          <span className="btn-icon">🖨️</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn icon-btn"
          onClick={() => store.undo()}
          disabled={!store.canUndo()}
          title="Undo (Ctrl+Z)"
        >
          <span className="btn-icon">↩️</span>
        </button>
        <button
          className="toolbar-btn icon-btn"
          onClick={() => store.redo()}
          disabled={!store.canRedo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <span className="btn-icon">↪️</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button className="toolbar-btn icon-btn" title="Cut (Ctrl+X)">
          <span className="btn-icon">✂️</span>
        </button>
        <button className="toolbar-btn icon-btn" title="Copy (Ctrl+C)">
          <span className="btn-icon">📋</span>
        </button>
        <button className="toolbar-btn icon-btn" title="Paste (Ctrl+V)">
          <span className="btn-icon">📌</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className={`toolbar-btn tool-btn ${state.activeTool === 'select' ? 'active' : ''}`}
          onClick={() => store.setActiveTool('select')}
          title="Smart Select (V)"
        >
          <span className="btn-icon">⬚</span>
          <span className="btn-label">Select</span>
        </button>
        <button
          className={`toolbar-btn tool-btn ${state.activeTool === 'text' ? 'active' : ''}`}
          onClick={() => store.setActiveTool('text')}
          title="Text Insertion (T)"
        >
          <span className="btn-icon">I</span>
          <span className="btn-label">Text</span>
        </button>
        <button
          className={`toolbar-btn tool-btn ${state.activeTool === 'textFrame' ? 'active' : ''}`}
          onClick={() => store.setActiveTool('textFrame')}
          title="Draw Text Frame (F)"
        >
          <span className="btn-icon">▭</span>
          <span className="btn-label">Frame</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group zoom-group">
        <button
          className="toolbar-btn icon-btn small"
          onClick={() => store.setZoom(state.zoom - 25)}
          title="Zoom Out (Ctrl+-)"
        >
          <span className="btn-icon">🔍−</span>
        </button>
        <select
          className="zoom-select"
          value={state.zoom}
          onChange={(e) => store.setZoom(parseInt(e.target.value))}
          title="Zoom Level"
        >
          <option value="25">25%</option>
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
          <option value="200">200%</option>
          <option value="400">400%</option>
        </select>
        <button
          className="toolbar-btn icon-btn small"
          onClick={() => store.setZoom(state.zoom + 25)}
          title="Zoom In (Ctrl+=)"
        >
          <span className="btn-icon">🔍+</span>
        </button>
        <button
          className="toolbar-btn icon-btn small"
          onClick={() => store.setZoom(100)}
          title="Fit Page"
        >
          <span className="btn-icon">⊡</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group view-toggles">
        <button
          className={`toolbar-btn toggle-btn ${state.showGrid ? 'active' : ''}`}
          onClick={() => store.toggleGrid()}
          title="Toggle Grid"
        >
          <span className="btn-icon">⊞</span>
        </button>
        <button
          className={`toolbar-btn toggle-btn ${state.showMargins ? 'active' : ''}`}
          onClick={() => store.toggleMargins()}
          title="Toggle Margins"
        >
          <span className="btn-icon">⊟</span>
        </button>
        <button
          className={`toolbar-btn toggle-btn ${state.showFrameBorders ? 'active' : ''}`}
          onClick={() => store.toggleFrameBorders()}
          title="Toggle Frame Borders"
        >
          <span className="btn-icon">▢</span>
        </button>
      </div>
    </div>
  );
};
