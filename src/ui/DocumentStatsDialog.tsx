// Document Statistics Dialog - show word count, character count, etc.
import React, { useMemo } from 'react';
import { useStore } from '../document/store';
import { calculateDocumentStats } from '../utils/documentStats';

interface DocumentStatsDialogProps {
  visible: boolean;
  onClose: () => void;
}

export const DocumentStatsDialog: React.FC<DocumentStatsDialogProps> = ({ visible, onClose }) => {
  const state = useStore();

  // Memoize expensive statistics calculation
  const stats = useMemo(() => calculateDocumentStats(state), [state]);

  if (!visible) return null;

  return (
    <div className="fm-dialog-overlay">
      <div className="fm-dialog stats-dialog">
        <div className="dialog-title">Document Statistics</div>

        <div className="dialog-content">
          <div className="stats-section">
            <div className="stats-header">Document Overview</div>
            <div className="stat-row">
              <span className="stat-label">Document Name:</span>
              <span className="stat-value">{state.document.name}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Total Pages:</span>
              <span className="stat-value">{state.document.pages.length}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Total Frames:</span>
              <span className="stat-value">{stats.totalFrames}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Text Frames:</span>
              <span className="stat-value">{stats.textFrames}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Image Frames:</span>
              <span className="stat-value">{stats.imageFrames}</span>
            </div>
          </div>

          <div className="stats-section">
            <div className="stats-header">Text Statistics</div>
            <div className="stat-row">
              <span className="stat-label">Total Characters:</span>
              <span className="stat-value">{stats.totalCharacters.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Characters (no spaces):</span>
              <span className="stat-value">{stats.charactersNoSpaces.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Total Words:</span>
              <span className="stat-value">{stats.totalWords.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Total Paragraphs:</span>
              <span className="stat-value">{stats.totalParagraphs}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Average Words/Para:</span>
              <span className="stat-value">
                {stats.totalParagraphs > 0
                  ? (stats.totalWords / stats.totalParagraphs).toFixed(1)
                  : '0'}
              </span>
            </div>
          </div>

          <div className="stats-section">
            <div className="stats-header">Content Elements</div>
            <div className="stat-row">
              <span className="stat-label">Equations:</span>
              <span className="stat-value">{stats.equations}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Tables:</span>
              <span className="stat-value">{stats.tables}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Images:</span>
              <span className="stat-value">{stats.imageFrames}</span>
            </div>
          </div>

          <div className="stats-section">
            <div className="stats-header">Document Properties</div>
            <div className="stat-row">
              <span className="stat-label">Page Size:</span>
              <span className="stat-value">
                {state.document.pageSize.width}pt x {state.document.pageSize.height}pt
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Units:</span>
              <span className="stat-value">{state.document.settings.units}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Created:</span>
              <span className="stat-value">
                {new Date(state.document.metadata.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Last Modified:</span>
              <span className="stat-value">
                {new Date(state.document.metadata.modifiedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="dialog-buttons">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
