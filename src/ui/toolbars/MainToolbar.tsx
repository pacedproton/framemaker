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
          title="New Document (Ctrl+N)"
        >
          New
        </button>
        <button className="toolbar-btn" title="Open Document (Ctrl+O)">
          Open
        </button>
        <button className="toolbar-btn" title="Save Document (Ctrl+S)">
          Save
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => store.undo()}
          disabled={!store.canUndo()}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          className="toolbar-btn"
          onClick={() => store.redo()}
          disabled={!store.canRedo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          Redo
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${state.activeTool === 'select' ? 'active' : ''}`}
          onClick={() => store.setActiveTool('select')}
          title="Smart Select (V)"
        >
          [+]
        </button>
        <button
          className={`toolbar-btn ${state.activeTool === 'text' ? 'active' : ''}`}
          onClick={() => store.setActiveTool('text')}
          title="Text Tool (T)"
        >
          A
        </button>
        <button
          className={`toolbar-btn ${state.activeTool === 'textFrame' ? 'active' : ''}`}
          onClick={() => store.setActiveTool('textFrame')}
          title="Draw Text Frame (F)"
        >
          [_]
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
          <option value="150">150%</option>
          <option value="200">200%</option>
        </select>
        <button
          className="toolbar-btn"
          onClick={() => store.setZoom(state.zoom + 25)}
          title="Zoom In"
        >
          +
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${state.showGrid ? 'active' : ''}`}
          onClick={() => store.toggleGrid()}
          title="Toggle Grid"
        >
          Grid
        </button>
        <button
          className={`toolbar-btn ${state.showFrameBorders ? 'active' : ''}`}
          onClick={() => store.toggleFrameBorders()}
          title="Toggle Borders"
        >
          Bord
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <span className="toolbar-label">
          Page {state.currentPageIndex + 1}/{state.document.pages.length}
        </span>
        <button
          className="toolbar-btn"
          onClick={() => store.setCurrentPage(state.currentPageIndex - 1)}
          disabled={state.currentPageIndex === 0}
          title="Previous Page"
        >
          &lt;
        </button>
        <button
          className="toolbar-btn"
          onClick={() => store.setCurrentPage(state.currentPageIndex + 1)}
          disabled={state.currentPageIndex === state.document.pages.length - 1}
          title="Next Page"
        >
          &gt;
        </button>
        <button
          className="toolbar-btn"
          onClick={() => store.addPage()}
          title="Add Page"
        >
          +Pg
        </button>
      </div>
    </div>
  );
};
