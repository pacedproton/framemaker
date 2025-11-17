import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { Search, X, ChevronDown, ChevronUp, Settings } from 'lucide-react';

const FindReplaceDialog: React.FC = () => {
  const {
    showFindReplace,
    toggleFindReplace,
    findReplaceOptions,
    setFindReplaceOptions,
    currentSearchIndex,
    performSearch,
    goToNextResult,
    goToPrevResult,
    replaceCurrentResult,
    replaceAllResults,
    currentDocument,
  } = useDocumentStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localResults, setLocalResults] = useState<{ count: number; current: number }>({
    count: 0,
    current: 0,
  });

  useEffect(() => {
    if (findReplaceOptions.searchText && currentDocument) {
      const results = searchInContent(currentDocument.content, findReplaceOptions);
      setLocalResults({ count: results.length, current: currentSearchIndex + 1 });
    } else {
      setLocalResults({ count: 0, current: 0 });
    }
  }, [findReplaceOptions.searchText, currentDocument, currentSearchIndex]);

  if (!showFindReplace) return null;

  const handleSearch = () => {
    performSearch();
    highlightMatches();
  };

  const highlightMatches = () => {
    // Remove existing highlights
    document.querySelectorAll('.search-highlight').forEach((el) => {
      el.classList.remove('search-highlight');
    });

    if (!findReplaceOptions.searchText) return;

    const editorContent = document.querySelector('.editor-content');
    if (!editorContent) return;

    // Simple text highlighting (for demonstration)
    const walker = document.createTreeWalker(editorContent, NodeFilter.SHOW_TEXT);
    let node;
    const searchTerm = findReplaceOptions.caseSensitive
      ? findReplaceOptions.searchText
      : findReplaceOptions.searchText.toLowerCase();

    while ((node = walker.nextNode())) {
      const text = findReplaceOptions.caseSensitive ? node.textContent : node.textContent?.toLowerCase();
      if (text && text.includes(searchTerm)) {
        const span = document.createElement('span');
        span.className = 'search-highlight';
        const parent = node.parentNode;
        if (parent) {
          parent.replaceChild(span, node);
          span.appendChild(node);
        }
      }
    }
  };

  return (
    <div className="find-replace-panel">
      <div className="panel-header">
        <h3>
          <Search size={16} />
          Find & Replace
        </h3>
        <button className="close-button" onClick={toggleFindReplace}>
          <X size={18} />
        </button>
      </div>

      <div className="panel-content">
        <div className="search-field">
          <label>Find:</label>
          <div className="input-with-controls">
            <input
              type="text"
              value={findReplaceOptions.searchText}
              onChange={(e) => setFindReplaceOptions({ searchText: e.target.value })}
              placeholder="Search text..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <div className="search-navigation">
              <button onClick={goToPrevResult} title="Previous (Shift+Enter)">
                <ChevronUp size={16} />
              </button>
              <button onClick={goToNextResult} title="Next (Enter)">
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
          {findReplaceOptions.searchText && (
            <div className="search-count">
              {localResults.count > 0
                ? `${localResults.current} of ${localResults.count} matches`
                : 'No matches found'}
            </div>
          )}
        </div>

        <div className="replace-field">
          <label>Replace:</label>
          <input
            type="text"
            value={findReplaceOptions.replaceText}
            onChange={(e) => setFindReplaceOptions({ replaceText: e.target.value })}
            placeholder="Replace with..."
          />
        </div>

        <div className="search-actions">
          <button onClick={replaceCurrentResult} disabled={localResults.count === 0}>
            Replace
          </button>
          <button onClick={replaceAllResults} disabled={localResults.count === 0}>
            Replace All
          </button>
          <button onClick={handleSearch}>Find All</button>
        </div>

        <div className="search-options">
          <div className="option-group">
            <label>
              <input
                type="checkbox"
                checked={findReplaceOptions.caseSensitive}
                onChange={(e) => setFindReplaceOptions({ caseSensitive: e.target.checked })}
              />
              Case sensitive
            </label>
            <label>
              <input
                type="checkbox"
                checked={findReplaceOptions.wholeWord}
                onChange={(e) => setFindReplaceOptions({ wholeWord: e.target.checked })}
              />
              Whole word
            </label>
            <label>
              <input
                type="checkbox"
                checked={findReplaceOptions.useRegex}
                onChange={(e) => setFindReplaceOptions({ useRegex: e.target.checked })}
              />
              Use regex
            </label>
          </div>
        </div>

        <button
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings size={14} />
          Advanced Options
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAdvanced && (
          <div className="advanced-options">
            <div className="form-group">
              <label>Search in:</label>
              <select
                value={findReplaceOptions.searchIn}
                onChange={(e) =>
                  setFindReplaceOptions({
                    searchIn: e.target.value as 'document' | 'book' | 'selection',
                  })
                }
              >
                <option value="document">Current Document</option>
                <option value="selection">Selection Only</option>
                <option value="book">Entire Book</option>
              </select>
            </div>

            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  checked={findReplaceOptions.includeStyles}
                  onChange={(e) => setFindReplaceOptions({ includeStyles: e.target.checked })}
                />
                Search in style names
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={findReplaceOptions.includeConditions}
                  onChange={(e) => setFindReplaceOptions({ includeConditions: e.target.checked })}
                />
                Include hidden conditional text
              </label>
            </div>

            <div className="special-characters">
              <h4>Special Characters</h4>
              <div className="char-buttons">
                <button
                  onClick={() =>
                    setFindReplaceOptions({
                      searchText: findReplaceOptions.searchText + '\\n',
                    })
                  }
                >
                  \n (newline)
                </button>
                <button
                  onClick={() =>
                    setFindReplaceOptions({
                      searchText: findReplaceOptions.searchText + '\\t',
                    })
                  }
                >
                  \t (tab)
                </button>
                <button
                  onClick={() =>
                    setFindReplaceOptions({
                      searchText: findReplaceOptions.searchText + '\\s',
                    })
                  }
                >
                  \s (space)
                </button>
                <button
                  onClick={() =>
                    setFindReplaceOptions({
                      searchText: findReplaceOptions.searchText + '.*',
                    })
                  }
                >
                  .* (any)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const searchInContent = (content: any[], options: any): any[] => {
  const results: any[] = [];
  const searchTerm = options.caseSensitive
    ? options.searchText
    : options.searchText.toLowerCase();

  const searchNode = (node: any, path: number[] = []) => {
    if (node.text) {
      const text = options.caseSensitive ? node.text : node.text.toLowerCase();
      let index = 0;
      while ((index = text.indexOf(searchTerm, index)) !== -1) {
        results.push({ path, offset: index });
        index += searchTerm.length;
      }
    }
    if (node.children) {
      node.children.forEach((child: any, i: number) => {
        searchNode(child, [...path, i]);
      });
    }
  };

  content.forEach((node, i) => searchNode(node, [i]));
  return results;
};

export default FindReplaceDialog;
