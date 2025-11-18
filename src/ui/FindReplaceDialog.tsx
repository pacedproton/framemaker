// Find/Replace Dialog - search and replace text
import React, { useState, useCallback } from 'react';
import { store, useStore } from '../document/store';
import { searchDocument } from '../utils/textSearch';

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

  const handleFind = useCallback(() => {
    if (!findText.trim()) {
      setResults('Please enter text to find.');
      return;
    }

    const count = searchDocument(state, findText, { caseSensitive, wholeWord });

    setResults(
      count > 0
        ? `Found ${count} occurrence(s) of "${findText}"`
        : `"${findText}" not found in document.`
    );
  }, [findText, caseSensitive, wholeWord, state]);

  const handleReplace = useCallback(() => {
    if (!findText.trim()) {
      setResults('Please enter text to find.');
      return;
    }

    if (!state.editingFrameId) {
      setResults('Please click in a text frame first to replace text.');
      return;
    }

    const replaced = store.replaceTextInDocument(findText, replaceText, {
      caseSensitive,
      wholeWord,
      frameId: state.editingFrameId,
    });

    setResults(
      replaced > 0
        ? `Replaced ${replaced} occurrence(s) in current frame.`
        : `"${findText}" not found in current frame.`
    );
  }, [findText, replaceText, caseSensitive, wholeWord, state.editingFrameId]);

  const handleReplaceAll = useCallback(() => {
    if (!findText.trim()) {
      setResults('Please enter text to find.');
      return;
    }

    const totalReplaced = store.replaceTextInDocument(findText, replaceText, {
      caseSensitive,
      wholeWord,
    });

    setResults(
      totalReplaced > 0
        ? `Replaced ${totalReplaced} occurrence(s) in entire document.`
        : `"${findText}" not found in document.`
    );
  }, [findText, replaceText, caseSensitive, wholeWord]);

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
