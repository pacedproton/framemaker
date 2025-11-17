// Status Bar - shows document state information
import React from 'react';
import { useStore, store } from '../document/store';

export const StatusBar: React.FC = () => {
  const state = useStore();

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
      <span className="status-field">
        Page {state.currentPageIndex + 1} of {state.document.pages.length}
      </span>
      <span className="status-field">
        Flow: {currentFlow}
      </span>
      <span className="status-field">
        {currentParaFormat}
      </span>
      <span className="status-field">
        Ln {cursorInfo.line} Col {cursorInfo.col}
      </span>
      <span className="status-field">
        {state.activeTool === 'text'
          ? 'Text Tool'
          : state.activeTool === 'select'
          ? 'Object Select'
          : state.activeTool === 'textFrame'
          ? 'Draw Frame'
          : 'Pan'}
      </span>
      {state.editingFrameId && (
        <span className="status-field editing">
          EDITING
        </span>
      )}
      <span className="status-field zoom">
        {state.zoom}%
      </span>
    </div>
  );
};
