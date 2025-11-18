// Status Bar - shows document state information
import React, { useMemo } from 'react';
import { useStore, store } from '../document/store';

interface StatusInfo {
  paraFormat: string;
  flowTag: string;
  line: number;
  col: number;
}

const getStatusInfo = (
  editingFrameId: string | null,
  cursor: ReturnType<typeof useStore>['cursor']
): StatusInfo => {
  const defaultInfo: StatusInfo = {
    paraFormat: 'Body',
    flowTag: '-',
    line: 1,
    col: 1,
  };

  if (!editingFrameId || !cursor) return defaultInfo;

  const frame = store.getTextFrame(editingFrameId);
  if (!frame) return defaultInfo;

  // Get paragraph format
  const para = frame.paragraphs.find((p) => p.id === cursor.paragraphId);
  const paraFormat = para?.formatTag || 'Body';

  // Get flow tag
  const flowTag = frame.flowTag;

  // Get cursor line number
  let line = 1;
  for (const p of frame.paragraphs) {
    if (p.id === cursor.paragraphId) break;
    line++;
  }

  return {
    paraFormat,
    flowTag,
    line,
    col: cursor.offset + 1,
  };
};

const getToolName = (tool: string): string => {
  switch (tool) {
    case 'text':
      return 'Text Tool';
    case 'select':
      return 'Object Select';
    case 'textFrame':
      return 'Draw Frame';
    default:
      return 'Pan';
  }
};

export const StatusBar: React.FC = () => {
  const state = useStore();

  const statusInfo = useMemo(
    () => getStatusInfo(state.editingFrameId, state.cursor),
    [state.editingFrameId, state.cursor]
  );

  return (
    <div className="fm-status-bar">
      <span className="status-field">
        Page {state.currentPageIndex + 1} of {state.document.pages.length}
      </span>
      <span className="status-field">Flow: {statusInfo.flowTag}</span>
      <span className="status-field">{statusInfo.paraFormat}</span>
      <span className="status-field">
        Ln {statusInfo.line} Col {statusInfo.col}
      </span>
      <span className="status-field">{getToolName(state.activeTool)}</span>
      {state.editingFrameId && <span className="status-field editing">EDITING</span>}
      <span className="status-field zoom">{state.zoom}%</span>
    </div>
  );
};
