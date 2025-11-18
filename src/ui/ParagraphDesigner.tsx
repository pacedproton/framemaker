// Paragraph Designer Dialog - comprehensive paragraph formatting
import React, { useState, useCallback } from 'react';
import { store, useStore } from '../document/store';

interface ParagraphDesignerProps {
  visible: boolean;
  onClose: () => void;
}

export const ParagraphDesigner: React.FC<ParagraphDesignerProps> = ({ visible, onClose }) => {
  const state = useStore();

  const [tag, setTag] = useState('Body');
  const [fontFamily, setFontFamily] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState(12);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justified'>('left');
  const [spaceAbove, setSpaceAbove] = useState(0);
  const [spaceBelow, setSpaceBelow] = useState(12);
  const [firstIndent, setFirstIndent] = useState(0);
  const [leftIndent, setLeftIndent] = useState(0);
  const [rightIndent, setRightIndent] = useState(0);
  const [activeTab, setActiveTab] = useState<'basic' | 'spacing' | 'indents'>('basic');

  if (!visible) return null;

  const handleApply = useCallback(() => {
    // Apply to current paragraph
    if (state.cursor && state.editingFrameId) {
      store.applyParagraphFormat(tag);
    }

    onClose();
  }, [tag, state.cursor, state.editingFrameId, onClose]);

  return (
    <div className="fm-dialog-overlay">
      <div className="fm-dialog para-designer-dialog">
        <div className="dialog-title">Paragraph Designer</div>

        <div className="dialog-content">
          {/* Tab Navigation */}
          <div className="designer-tabs">
            <button
              className={`designer-tab ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              Basic
            </button>
            <button
              className={`designer-tab ${activeTab === 'spacing' ? 'active' : ''}`}
              onClick={() => setActiveTab('spacing')}
            >
              Spacing
            </button>
            <button
              className={`designer-tab ${activeTab === 'indents' ? 'active' : ''}`}
              onClick={() => setActiveTab('indents')}
            >
              Indents
            </button>
          </div>

          {/* Basic Properties Tab */}
          {activeTab === 'basic' && (
            <div className="designer-panel">
              <div className="designer-section">
                <div className="designer-row">
                  <label>Tag:</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="designer-input"
                  />
                </div>

                <div className="designer-row">
                  <label>Font Family:</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="designer-select"
                  >
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Palatino Linotype">Palatino Linotype</option>
                  </select>
                </div>

                <div className="designer-row">
                  <label>Font Size:</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseFloat(e.target.value) || 12)}
                    min={6}
                    max={72}
                    step={0.5}
                    className="designer-input small"
                  />
                  <span className="unit">pt</span>
                </div>

                <div className="designer-row">
                  <label>Alignment:</label>
                  <div className="alignment-buttons">
                    <button
                      className={`align-btn ${alignment === 'left' ? 'active' : ''}`}
                      onClick={() => setAlignment('left')}
                      title="Left"
                    >
                      ⚏
                    </button>
                    <button
                      className={`align-btn ${alignment === 'center' ? 'active' : ''}`}
                      onClick={() => setAlignment('center')}
                      title="Center"
                    >
                      ⚎
                    </button>
                    <button
                      className={`align-btn ${alignment === 'right' ? 'active' : ''}`}
                      onClick={() => setAlignment('right')}
                      title="Right"
                    >
                      ⚐
                    </button>
                    <button
                      className={`align-btn ${alignment === 'justified' ? 'active' : ''}`}
                      onClick={() => setAlignment('justified')}
                      title="Justified"
                    >
                      ≡
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Spacing Tab */}
          {activeTab === 'spacing' && (
            <div className="designer-panel">
              <div className="designer-section">
                <div className="designer-row">
                  <label>Line Spacing:</label>
                  <input
                    type="number"
                    value={lineSpacing}
                    onChange={(e) => setLineSpacing(parseFloat(e.target.value) || 1.5)}
                    min={0.5}
                    max={5}
                    step={0.1}
                    className="designer-input small"
                  />
                  <span className="unit">×</span>
                </div>

                <div className="designer-row">
                  <label>Space Above:</label>
                  <input
                    type="number"
                    value={spaceAbove}
                    onChange={(e) => setSpaceAbove(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                    step={0.5}
                    className="designer-input small"
                  />
                  <span className="unit">pt</span>
                </div>

                <div className="designer-row">
                  <label>Space Below:</label>
                  <input
                    type="number"
                    value={spaceBelow}
                    onChange={(e) => setSpaceBelow(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                    step={0.5}
                    className="designer-input small"
                  />
                  <span className="unit">pt</span>
                </div>
              </div>
            </div>
          )}

          {/* Indents Tab */}
          {activeTab === 'indents' && (
            <div className="designer-panel">
              <div className="designer-section">
                <div className="designer-row">
                  <label>First Line:</label>
                  <input
                    type="number"
                    value={firstIndent}
                    onChange={(e) => setFirstIndent(parseFloat(e.target.value) || 0)}
                    min={-100}
                    max={100}
                    step={0.5}
                    className="designer-input small"
                  />
                  <span className="unit">pt</span>
                </div>

                <div className="designer-row">
                  <label>Left Indent:</label>
                  <input
                    type="number"
                    value={leftIndent}
                    onChange={(e) => setLeftIndent(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={200}
                    step={0.5}
                    className="designer-input small"
                  />
                  <span className="unit">pt</span>
                </div>

                <div className="designer-row">
                  <label>Right Indent:</label>
                  <input
                    type="number"
                    value={rightIndent}
                    onChange={(e) => setRightIndent(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={200}
                    step={0.5}
                    className="designer-input small"
                  />
                  <span className="unit">pt</span>
                </div>
              </div>

              {/* Visual Preview */}
              <div className="indent-preview">
                <div className="preview-label">Preview:</div>
                <div
                  className="preview-box"
                  style={{
                    paddingLeft: `${leftIndent}px`,
                    paddingRight: `${rightIndent}px`,
                  }}
                >
                  <div style={{ textIndent: `${firstIndent}px` }}>
                    This is sample text to show how the paragraph formatting will look with the current settings.
                    The first line indent is applied to this line.
                  </div>
                  <div>
                    This is the second line which shows the left and right indents but not the first line indent.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-buttons">
          <button onClick={handleApply}>Apply</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
