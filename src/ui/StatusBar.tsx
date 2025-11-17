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

  // Get cursor position info
  const getCursorInfo = () => {
    if (!state.cursor || !state.editingFrameId) return { line: 1, col: 1 };
    const frame = store.getTextFrame(state.editingFrameId);
    if (!frame) return { line: 1, col: 1 };

    let lineNum = 1;
    for (const para of frame.paragraphs) {
      if (para.id === state.cursor.paragraphId) break;
      lineNum++;
    }
    return { line: lineNum, col: state.cursor.offset + 1 };
  };

  const cursorInfo = getCursorInfo();

  return (
    <div className="fm-status-bar">
      <div className="status-section">
        <div className="status-cell tool-cell">
          <span className="status-label">Tool:</span>
          <span className="status-value">
            {state.activeTool === 'text'
              ? 'Text I-Beam'
              : state.activeTool === 'select'
              ? 'Smart Select'
              : state.activeTool === 'textFrame'
              ? 'Draw Frame'
              : 'Pan/Zoom'}
          </span>
        </div>
      </div>

      <div className="status-section">
        <div className="status-cell">
          <span className="status-label">¶</span>
          <span className="status-value tag">{currentParaFormat}</span>
        </div>
        <div className="status-cell">
          <span className="status-label">Flow:</span>
          <span className="status-value">{currentFlow}</span>
        </div>
      </div>

      <div className="status-section">
        <div className="status-cell">
          <span className="status-label">Ln:</span>
          <span className="status-value">{cursorInfo.line}</span>
        </div>
        <div className="status-cell">
          <span className="status-label">Col:</span>
          <span className="status-value">{cursorInfo.col}</span>
        </div>
      </div>

      <div className="status-section">
        <div className="status-cell">
          <span className="status-label">Frames:</span>
          <span className="status-value">{currentPage.frames.length}</span>
        </div>
        {state.selectedFrameIds.length > 0 && (
          <div className="status-cell selected-cell">
            <span className="status-value">
              {state.selectedFrameIds.length} Selected
            </span>
          </div>
        )}
      </div>

      <div className="status-section mode-section">
        {state.editingFrameId && (
          <div className="status-indicator editing">
            EDIT
          </div>
        )}
        <div className="status-indicator">
          {state.document.settings.snapToGrid ? 'SNAP' : ''}
        </div>
      </div>

      <div className="status-section timestamp">
        <span className="status-value muted">
          {new Date(state.document.metadata.modifiedAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
