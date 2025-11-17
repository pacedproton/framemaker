// Status Bar - shows document state information
import React from 'react';
import { useStore, store } from '../document/store';

export const StatusBar: React.FC = () => {
  const state = useStore();
  const currentPage = state.document.pages[state.currentPageIndex];

  // Get current paragraph format
  let currentParaFormat = 'Body';
  if (state.cursor && state.editingFrameId) {
    const frame = store.getTextFrame(state.editingFrameId);
    if (frame) {
      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (para) currentParaFormat = para.formatTag;
    }
  }

  // Get current flow tag
  const currentFlow = state.editingFrameId
    ? (() => {
        const frame = store.getTextFrame(state.editingFrameId);
        return frame ? frame.flowTag : '-';
      })()
    : '-';

  return (
    <div className="fm-status-bar">
      <div className="status-left">
        <span className="status-item">
          Page {state.currentPageIndex + 1} of {state.document.pages.length}
        </span>
        <span className="status-item">Flow: {currentFlow}</span>
        <span className="status-item">¶ {currentParaFormat}</span>
      </div>

      <div className="status-center">
        <span className="status-item tool-indicator">
          {state.activeTool === 'text'
            ? 'Text Tool'
            : state.activeTool === 'select'
            ? 'Select Tool'
            : state.activeTool === 'textFrame'
            ? 'Draw Text Frame'
            : 'Pan'}
        </span>
        {state.editingFrameId && <span className="status-item editing">Editing</span>}
      </div>

      <div className="status-right">
        <span className="status-item">Frames: {currentPage.frames.length}</span>
        <span className="status-item zoom">{state.zoom}%</span>
        <span className="status-item modified">
          Modified: {new Date(state.document.metadata.modifiedAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
