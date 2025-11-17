// Character Formatting Dialog - style text properties
import React, { useState } from 'react';
import { store } from '../document/store';

interface CharacterDialogProps {
  visible: boolean;
  onClose: () => void;
}

export const CharacterDialog: React.FC<CharacterDialogProps> = ({ visible, onClose }) => {
  const [fontFamily, setFontFamily] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState(12);
  const [fontWeight, setFontWeight] = useState('Regular');
  const [textColor, setTextColor] = useState('#000000');
  const [underline, setUnderline] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);
  const [superscript, setSuperscript] = useState(false);
  const [subscript, setSubscript] = useState(false);
  const [smallCaps, setSmallCaps] = useState(false);
  const [tracking, setTracking] = useState(0);

  if (!visible) return null;

  const handleApply = () => {
    // Apply character formatting
    store.applyFontFamily(fontFamily);
    store.applyFontSize(fontSize);

    if (fontWeight === 'Bold' || fontWeight === 'Bold Italic') {
      store.toggleBold();
    }
    if (fontWeight === 'Italic' || fontWeight === 'Bold Italic') {
      store.toggleItalic();
    }
    if (underline) {
      store.toggleUnderline();
    }

    onClose();
  };

  return (
    <div className="fm-dialog-overlay">
      <div className="fm-dialog character-dialog">
        <div className="dialog-title">Character Designer</div>

        <div className="dialog-content">
          <div className="char-section">
            <div className="section-header">Family</div>
            <div className="char-row">
              <label>Font:</label>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Arial">Arial</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Palatino Linotype">Palatino Linotype</option>
                <option value="Book Antiqua">Book Antiqua</option>
                <option value="Garamond">Garamond</option>
              </select>
            </div>
          </div>

          <div className="char-section">
            <div className="section-header">Size & Weight</div>
            <div className="char-row">
              <label>Size:</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                min={6}
                max={144}
              />
              <span className="unit">pt</span>
            </div>
            <div className="char-row">
              <label>Weight:</label>
              <select value={fontWeight} onChange={(e) => setFontWeight(e.target.value)}>
                <option value="Regular">Regular</option>
                <option value="Bold">Bold</option>
                <option value="Italic">Italic</option>
                <option value="Bold Italic">Bold Italic</option>
              </select>
            </div>
          </div>

          <div className="char-section">
            <div className="section-header">Color & Effects</div>
            <div className="char-row">
              <label>Color:</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="color-picker"
              />
              <span className="color-value">{textColor}</span>
            </div>
            <div className="char-checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={underline}
                  onChange={(e) => setUnderline(e.target.checked)}
                />
                Underline
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={strikethrough}
                  onChange={(e) => setStrikethrough(e.target.checked)}
                />
                Strikethrough
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={smallCaps}
                  onChange={(e) => setSmallCaps(e.target.checked)}
                />
                Small Caps
              </label>
            </div>
          </div>

          <div className="char-section">
            <div className="section-header">Position</div>
            <div className="char-radio-group">
              <label>
                <input
                  type="radio"
                  name="position"
                  checked={!superscript && !subscript}
                  onChange={() => {
                    setSuperscript(false);
                    setSubscript(false);
                  }}
                />
                Normal
              </label>
              <label>
                <input
                  type="radio"
                  name="position"
                  checked={superscript}
                  onChange={() => {
                    setSuperscript(true);
                    setSubscript(false);
                  }}
                />
                Superscript
              </label>
              <label>
                <input
                  type="radio"
                  name="position"
                  checked={subscript}
                  onChange={() => {
                    setSuperscript(false);
                    setSubscript(true);
                  }}
                />
                Subscript
              </label>
            </div>
          </div>

          <div className="char-section">
            <div className="section-header">Spacing</div>
            <div className="char-row">
              <label>Tracking:</label>
              <input
                type="number"
                value={tracking}
                onChange={(e) => setTracking(parseInt(e.target.value) || 0)}
                min={-100}
                max={1000}
              />
              <span className="unit">% of em</span>
            </div>
          </div>

          <div className="char-preview">
            <div className="preview-label">Preview:</div>
            <div
              className="preview-text"
              style={{
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight: fontWeight.includes('Bold') ? 'bold' : 'normal',
                fontStyle: fontWeight.includes('Italic') ? 'italic' : 'normal',
                color: textColor,
                textDecoration: underline ? 'underline' : strikethrough ? 'line-through' : 'none',
                fontVariant: smallCaps ? 'small-caps' : 'normal',
                letterSpacing: `${tracking / 100}em`,
              }}
            >
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        </div>

        <div className="dialog-buttons">
          <button onClick={handleApply}>Apply</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
