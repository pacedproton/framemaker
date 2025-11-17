// Frame Tools Toolbar
import React from 'react';
import { store, useStore } from '../core/store';
import type { Tool } from '../core/types';
import { PDFExporter, exportToJSON, importFromJSON } from '../core/export';

export const Toolbar: React.FC = () => {
  const state = useStore();

  const tools: { id: Tool; label: string; icon: string; shortcut: string }[] = [
    { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
    { id: 'text-frame', label: 'Text Frame', icon: 'T', shortcut: 'T' },
    { id: 'math-frame', label: 'Math Frame', icon: '∑', shortcut: 'M' },
    { id: 'graphic-frame', label: 'Graphic Frame', icon: '⌸', shortcut: 'G' },
    { id: 'table-frame', label: 'Table Frame', icon: '⊞', shortcut: 'B' },
    { id: 'pan', label: 'Pan', icon: '✋', shortcut: 'H' },
    { id: 'zoom', label: 'Zoom', icon: '🔍', shortcut: 'Z' },
  ];

  const handleToolClick = (tool: Tool) => {
    store.setTool(tool);
  };

  const handleZoomChange = (delta: number) => {
    store.setZoom(state.zoom + delta);
  };

  const handleDelete = () => {
    if (state.selectedFrameId) {
      store.removeFrame(state.selectedFrameId);
    }
  };

  const handleDuplicate = () => {
    if (state.selectedFrameId) {
      store.duplicateFrame(state.selectedFrameId);
    }
  };

  const handleBringToFront = () => {
    if (state.selectedFrameId) {
      store.bringToFront(state.selectedFrameId);
    }
  };

  const handleSendToBack = () => {
    if (state.selectedFrameId) {
      store.sendToBack(state.selectedFrameId);
    }
  };

  const handleExportPDF = async () => {
    const exporter = new PDFExporter();
    await exporter.exportToPDF(state.document.pages, `${state.document.name}.pdf`);
  };

  const handleSaveJSON = () => {
    const json = exportToJSON(state.document.pages);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.document.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const pages = importFromJSON(event.target?.result as string);
            store.newDocument('Imported Document');
            // Replace pages (would need to add this method to store)
            alert(`Loaded ${pages.length} pages`);
          } catch {
            alert('Failed to load document');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <div className="toolbar-group">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`tool-button ${state.activeTool === tool.id ? 'active' : ''}`}
              onClick={() => handleToolClick(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <button
          className="action-button"
          onClick={handleDelete}
          disabled={!state.selectedFrameId}
          title="Delete Frame"
        >
          🗑️ Delete
        </button>
        <button
          className="action-button"
          onClick={handleDuplicate}
          disabled={!state.selectedFrameId}
          title="Duplicate Frame"
        >
          📋 Duplicate
        </button>
        <button
          className="action-button"
          onClick={handleBringToFront}
          disabled={!state.selectedFrameId}
          title="Bring to Front"
        >
          ⬆️ Front
        </button>
        <button
          className="action-button"
          onClick={handleSendToBack}
          disabled={!state.selectedFrameId}
          title="Send to Back"
        >
          ⬇️ Back
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <button className="zoom-button" onClick={() => handleZoomChange(-10)} title="Zoom Out">
          −
        </button>
        <span className="zoom-display">{state.zoom}%</span>
        <button className="zoom-button" onClick={() => handleZoomChange(10)} title="Zoom In">
          +
        </button>
        <button className="zoom-button" onClick={() => store.setZoom(100)} title="Reset Zoom">
          100%
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={state.showGrid}
            onChange={() => store.toggleGrid()}
          />
          Grid
        </label>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={state.showMargins}
            onChange={() => store.toggleMargins()}
          />
          Margins
        </label>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={state.showFrameBorders}
            onChange={() => store.toggleFrameBorders()}
          />
          Borders
        </label>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <button className="action-button" onClick={() => store.addPage()} title="Add Page">
          + Page
        </button>
        <span className="page-info">
          Page {state.currentPageIndex + 1} of {state.document.pages.length}
        </span>
        {state.currentPageIndex > 0 && (
          <button
            className="page-nav"
            onClick={() => store.setCurrentPage(state.currentPageIndex - 1)}
          >
            ◀
          </button>
        )}
        {state.currentPageIndex < state.document.pages.length - 1 && (
          <button
            className="page-nav"
            onClick={() => store.setCurrentPage(state.currentPageIndex + 1)}
          >
            ▶
          </button>
        )}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <button className="action-button" onClick={handleSaveJSON} title="Save as JSON">
          💾 Save
        </button>
        <button className="action-button" onClick={handleLoadJSON} title="Load JSON">
          📂 Load
        </button>
        <button className="action-button" onClick={handleExportPDF} title="Export to PDF">
          📄 PDF
        </button>
      </div>
    </div>
  );
};
