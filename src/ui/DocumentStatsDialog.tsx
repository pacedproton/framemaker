// Document Statistics Dialog - show word count, character count, etc.
import React from 'react';
import { useStore } from '../document/store';

interface DocumentStatsDialogProps {
  visible: boolean;
  onClose: () => void;
}

export const DocumentStatsDialog: React.FC<DocumentStatsDialogProps> = ({ visible, onClose }) => {
  const state = useStore();

  if (!visible) return null;

  // Calculate statistics
  const stats = calculateDocumentStats(state);

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

interface DocumentStats {
  totalFrames: number;
  textFrames: number;
  imageFrames: number;
  totalCharacters: number;
  charactersNoSpaces: number;
  totalWords: number;
  totalParagraphs: number;
  equations: number;
  tables: number;
}

function calculateDocumentStats(state: ReturnType<typeof useStore>): DocumentStats {
  const stats: DocumentStats = {
    totalFrames: 0,
    textFrames: 0,
    imageFrames: 0,
    totalCharacters: 0,
    charactersNoSpaces: 0,
    totalWords: 0,
    totalParagraphs: 0,
    equations: 0,
    tables: 0,
  };

  for (const page of state.document.pages) {
    stats.totalFrames += page.frames.length;

    for (const frame of page.frames) {
      if (frame.type === 'text') {
        stats.textFrames++;
        const textFrame = frame as any;

        for (const para of textFrame.paragraphs) {
          stats.totalParagraphs++;

          for (const element of para.content) {
            if ('text' in element) {
              const text = element.text as string;
              stats.totalCharacters += text.length;
              stats.charactersNoSpaces += text.replace(/\s/g, '').length;

              // Count words (split by whitespace)
              const words = text.trim().split(/\s+/);
              stats.totalWords += words.filter((w) => w.length > 0).length;
            } else if (element.type === 'equation') {
              stats.equations++;
            } else if (element.type === 'table') {
              stats.tables++;
            }
          }
        }
      } else if (frame.type === 'image') {
        stats.imageFrames++;
      }
    }
  }

  return stats;
}
