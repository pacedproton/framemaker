// Find/Replace Dialog - search and replace text
import React, { useState } from 'react';
import { store, useStore } from '../document/store';

interface FindReplaceDialogProps {
  visible: boolean;
  onClose: () => void;
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({ visible, onClose }) => {
  const state = useStore();
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [searchDirection, setSearchDirection] = useState<'forward' | 'backward'>('forward');
  const [searchScope, setSearchScope] = useState<'document' | 'flow' | 'selection'>('document');
  const [results, setResults] = useState<string>('');

  if (!visible) return null;

  const handleFind = () => {
    if (!findText) {
      setResults('Please enter text to find.');
      return;
    }

    // Search through all text frames
    let count = 0;
    const pages = state.document.pages;

    for (const page of pages) {
      for (const frame of page.frames) {
        if (frame.type === 'text') {
          const textFrame = frame as any; // TextFrame type
          for (const para of textFrame.paragraphs) {
            for (const element of para.content) {
              if ('text' in element) {
                const text = element.text as string;
                const searchText = caseSensitive ? findText : findText.toLowerCase();
                const targetText = caseSensitive ? text : text.toLowerCase();

                if (wholeWord) {
                  const regex = new RegExp(`\\b${searchText}\\b`, caseSensitive ? 'g' : 'gi');
                  const matches = text.match(regex);
                  count += matches ? matches.length : 0;
                } else {
                  let pos = 0;
                  while ((pos = targetText.indexOf(searchText, pos)) !== -1) {
                    count++;
                    pos += searchText.length;
                  }
                }
              }
            }
          }
        }
      }
    }

    if (count > 0) {
      setResults(`Found ${count} occurrence(s) of "${findText}"`);
    } else {
      setResults(`"${findText}" not found in document.`);
    }
  };

  const handleReplace = () => {
    if (!findText) {
      setResults('Please enter text to find.');
      return;
    }

    // Replace in current editing frame only
    if (!state.editingFrameId) {
      setResults('Please click in a text frame first to replace text.');
      return;
    }

    const replaced = store.replaceTextInDocument(findText, replaceText, {
      caseSensitive,
      wholeWord,
      frameId: state.editingFrameId,
    });

    if (replaced > 0) {
      setResults(`Replaced ${replaced} occurrence(s) in current frame.`);
    } else {
      setResults(`"${findText}" not found in current frame.`);
    }
  };

  const handleReplaceAll = () => {
    if (!findText) {
      setResults('Please enter text to find.');
      return;
    }

    const totalReplaced = store.replaceTextInDocument(findText, replaceText, {
      caseSensitive,
      wholeWord,
    });

    if (totalReplaced > 0) {
      setResults(`Replaced ${totalReplaced} occurrence(s) in entire document.`);
    } else {
      setResults(`"${findText}" not found in document.`);
    }
  };

  return (
    <div className="fm-dialog-overlay">
      <div className="fm-dialog find-replace-dialog">
        <div className="dialog-title">Find/Change</div>

        <div className="dialog-content">
          <div className="find-row">
            <label>Find:</label>
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Text to find..."
              className="find-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFind();
              }}
            />
          </div>

          <div className="find-row">
            <label>Change To:</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replacement text..."
              className="find-input"
            />
          </div>

          <div className="find-options">
            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                />
                Case Sensitive
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                />
                Whole Word
              </label>
            </div>

            <div className="option-group">
              <span className="group-label">Direction:</span>
              <label>
                <input
                  type="radio"
                  name="direction"
                  checked={searchDirection === 'forward'}
                  onChange={() => setSearchDirection('forward')}
                />
                Forward
              </label>
              <label>
                <input
                  type="radio"
                  name="direction"
                  checked={searchDirection === 'backward'}
                  onChange={() => setSearchDirection('backward')}
                />
                Backward
              </label>
            </div>

            <div className="option-group">
              <span className="group-label">Scope:</span>
              <select value={searchScope} onChange={(e) => setSearchScope(e.target.value as any)}>
                <option value="document">Document</option>
                <option value="flow">Current Flow</option>
                <option value="selection">Selection</option>
              </select>
            </div>
          </div>

          <div className="find-results">
            <div className="results-label">Results:</div>
            <div className="results-text">{results || 'Ready to search...'}</div>
          </div>
        </div>

        <div className="dialog-buttons">
          <button onClick={handleFind}>Find</button>
          <button onClick={handleReplace}>Change</button>
          <button onClick={handleReplaceAll}>Change All</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
