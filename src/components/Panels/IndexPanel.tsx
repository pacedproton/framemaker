import React, { useState } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import type { IndexEntry } from '../../types/document';
import { v4 as uuidv4 } from 'uuid';
import { BookMarked, Plus, Trash2, Download } from 'lucide-react';

const IndexPanel: React.FC = () => {
  const { currentDocument, indexEntries, addIndexEntry, removeIndexEntry, generateIndex } =
    useDocumentStore();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    primaryTerm: '',
    secondaryTerm: '',
    pageNumber: 1,
  });

  if (!currentDocument) {
    return (
      <div className="panel index-panel">
        <div className="panel-header">
          <h3>Index</h3>
        </div>
        <div className="panel-content empty">
          <p>No document open</p>
        </div>
      </div>
    );
  }

  const handleAddEntry = () => {
    if (!newEntry.primaryTerm.trim()) return;

    const terms = [newEntry.primaryTerm];
    if (newEntry.secondaryTerm.trim()) {
      terms.push(newEntry.secondaryTerm);
    }

    const entry: IndexEntry = {
      id: uuidv4(),
      terms,
      pageNumber: newEntry.pageNumber,
      sortKey: newEntry.primaryTerm.toLowerCase(),
    };

    addIndexEntry(entry);
    setNewEntry({ primaryTerm: '', secondaryTerm: '', pageNumber: 1 });
    setShowNewForm(false);
  };

  const sortedEntries = generateIndex();
  const groupedEntries = groupEntriesByLetter(sortedEntries);

  const handleGenerateIndexDocument = () => {
    let indexText = '# Index\n\n';
    Object.keys(groupedEntries)
      .sort()
      .forEach((letter) => {
        indexText += `## ${letter}\n\n`;
        groupedEntries[letter].forEach((entry) => {
          const termString = entry.terms.join(' > ');
          indexText += `${termString}, ${entry.pageNumber}\n`;
        });
        indexText += '\n';
      });

    const blob = new Blob([indexText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel index-panel">
      <div className="panel-header">
        <h3>
          <BookMarked size={16} />
          Index
        </h3>
        <div className="panel-actions">
          <button
            className="panel-action-button"
            onClick={() => setShowNewForm(true)}
            title="Add Index Entry"
          >
            <Plus size={14} />
          </button>
          <button
            className="panel-action-button"
            onClick={handleGenerateIndexDocument}
            title="Generate Index Document"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      <div className="panel-content">
        {showNewForm && (
          <div className="new-index-form">
            <div className="form-group">
              <label>Primary Term</label>
              <input
                type="text"
                placeholder="Main index entry"
                value={newEntry.primaryTerm}
                onChange={(e) => setNewEntry({ ...newEntry, primaryTerm: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Secondary Term (optional)</label>
              <input
                type="text"
                placeholder="Sub-entry"
                value={newEntry.secondaryTerm}
                onChange={(e) => setNewEntry({ ...newEntry, secondaryTerm: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Page Number</label>
              <input
                type="number"
                min="1"
                value={newEntry.pageNumber}
                onChange={(e) => setNewEntry({ ...newEntry, pageNumber: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-actions">
              <button onClick={handleAddEntry}>Add</button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewEntry({ primaryTerm: '', secondaryTerm: '', pageNumber: 1 });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="index-entries">
          <div className="index-stats">
            <span>{indexEntries.length} entries</span>
          </div>

          {Object.keys(groupedEntries)
            .sort()
            .map((letter) => (
              <div key={letter} className="index-letter-group">
                <div className="letter-header">{letter}</div>
                <div className="letter-entries">
                  {groupedEntries[letter].map((entry) => (
                    <div key={entry.id} className="index-entry-item">
                      <div className="entry-terms">
                        {entry.terms.map((term, i) => (
                          <span key={i} className={`term-level-${i}`}>
                            {i > 0 && ' > '}
                            {term}
                          </span>
                        ))}
                      </div>
                      <div className="entry-page">{entry.pageNumber}</div>
                      <button
                        className="entry-delete"
                        onClick={() => removeIndexEntry(entry.id)}
                        title="Remove Entry"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {indexEntries.length === 0 && (
            <div className="no-entries">
              <p>No index entries yet.</p>
              <p>Add entries using the + button or by inserting index markers in your document.</p>
            </div>
          )}
        </div>

        <div className="index-help">
          <h4>Creating an Index</h4>
          <ul>
            <li>Add markers in your document for important terms</li>
            <li>Use primary and secondary terms for hierarchy</li>
            <li>Generate the final index document when ready</li>
            <li>Index updates automatically with page numbers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const groupEntriesByLetter = (entries: IndexEntry[]): Record<string, IndexEntry[]> => {
  const groups: Record<string, IndexEntry[]> = {};

  entries.forEach((entry) => {
    const firstLetter = entry.terms[0].charAt(0).toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(entry);
  });

  return groups;
};

export default IndexPanel;
