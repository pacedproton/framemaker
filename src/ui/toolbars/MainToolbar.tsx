// Main Toolbar - document operations and tools
import React from 'react';
import { store, useStore } from '../../document/store';

export const MainToolbar: React.FC = () => {
  const state = useStore();

  return (
    <div className="fm-main-toolbar">
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => store.newDocument('Untitled')}
          title="New Document"
        >
          New
        </button>
        <button className="toolbar-btn" title="Open Document">
          Open
        </button>
        <button className="toolbar-btn" title="Save Document">
          Save
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => store.undo()}
          disabled={!store.canUndo()}
          title="Undo"
        >
          Undo
        </button>
        <button
          className="toolbar-btn"
          onClick={() => store.redo()}
          disabled={!store.canRedo()}
          title="Redo"
        >
          Redo
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${state.activeTool === 'select' ? 'active' : ''}`}
          onClick={() => store.setActiveTool('select')}
          title="Select Tool (V)"
        >
          Select
        </button>
        <button
          className={`toolbar-btn ${state.activeTool === 'text' ? 'active' : ''}`}
          onClick={() => store.setActiveTool('text')}
          title="Text Tool (T)"
        >
          Text
        </button>
        <button
          className={`toolbar-btn ${state.activeTool === 'textFrame' ? 'active' : ''}`}
          onClick={() => store.setActiveTool('textFrame')}
          title="Draw Text Frame"
        >
          Frame
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => store.setZoom(state.zoom - 25)}
          title="Zoom Out"
        >
          -
        </button>
        <span className="zoom-display">{state.zoom}%</span>
        <button
          className="toolbar-btn"
          onClick={() => store.setZoom(state.zoom + 25)}
          title="Zoom In"
        >
          +
        </button>
        <button
          className="toolbar-btn"
          onClick={() => store.setZoom(100)}
          title="Reset Zoom"
        >
          100%
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <label className="toolbar-checkbox">
          <input
            type="checkbox"
            checked={state.showGrid}
            onChange={() => store.toggleGrid()}
          />
          Grid
        </label>
        <label className="toolbar-checkbox">
          <input
            type="checkbox"
            checked={state.showMargins}
            onChange={() => store.toggleMargins()}
          />
          Margins
        </label>
        <label className="toolbar-checkbox">
          <input
            type="checkbox"
            checked={state.showFrameBorders}
            onChange={() => store.toggleFrameBorders()}
          />
          Borders
        </label>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => store.addPage()}
          title="Add Page"
        >
          + Page
        </button>
        <span className="page-indicator">
          Page {state.currentPageIndex + 1} / {state.document.pages.length}
        </span>
        <button
          className="toolbar-btn"
          onClick={() => store.setCurrentPage(state.currentPageIndex - 1)}
          disabled={state.currentPageIndex === 0}
          title="Previous Page"
        >
          ◀
        </button>
        <button
          className="toolbar-btn"
          onClick={() => store.setCurrentPage(state.currentPageIndex + 1)}
          disabled={state.currentPageIndex === state.document.pages.length - 1}
          title="Next Page"
        >
          ▶
        </button>
      </div>
    </div>
  );
};
