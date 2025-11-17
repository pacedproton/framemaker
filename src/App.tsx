import React, { useEffect, useState } from 'react';
import { Slate } from 'slate-react';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { withReact } from 'slate-react';
import { useDocumentStore } from './store/documentStore';

// Components
import MenuBar from './components/MenuBar';
import MainToolbar, { FormatToolbar } from './components/Toolbar/MainToolbar';
import RichTextEditor from './components/Editor/RichTextEditor';
import StructurePanel from './components/Panels/StructurePanel';
import StylesPanel from './components/Panels/StylesPanel';
import VariablesPanel from './components/Panels/VariablesPanel';
import ConditionsPanel from './components/Panels/ConditionsPanel';
import IndexPanel from './components/Panels/IndexPanel';
import StatusBar from './components/StatusBar';

// Frame-based components
import FrameCanvas from './components/FrameCanvas/FrameCanvas';
import FrameToolbar from './components/FrameCanvas/FrameToolbar';
import './components/FrameCanvas/FrameCanvas.css';

// Dialogs
import InsertTableDialog from './components/Dialogs/InsertTableDialog';
import InsertImageDialog from './components/Dialogs/InsertImageDialog';
import ExportDialog from './components/Dialogs/ExportDialog';
import FindReplaceDialog from './components/Dialogs/FindReplaceDialog';

import './App.css';

function App() {
  const {
    currentDocument,
    createNewDocument,
    activePanel,
    setActivePanel,
    zoom,
    viewMode,
  } = useDocumentStore();

  const [editorMode, setEditorMode] = useState<'text' | 'frame'>('frame');

  // Create new document on first load
  useEffect(() => {
    if (!currentDocument) {
      createNewDocument();
    }
  }, [currentDocument, createNewDocument]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        useDocumentStore.getState().saveDocument();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        useDocumentStore.getState().toggleFindReplace();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewDocument();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewDocument]);

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'structure':
        return <StructurePanel />;
      case 'styles':
        return <StylesPanel />;
      case 'variables':
        return <VariablesPanel />;
      case 'conditions':
        return <ConditionsPanel />;
      case 'index':
        return <IndexPanel />;
      default:
        return <StructurePanel />;
    }
  };

  const editorStyle = {
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top center',
  };

  return (
    <div className="app">
      <MenuBar />
      <MainToolbar />

      <div className="mode-switcher">
        <button
          className={`mode-button ${editorMode === 'frame' ? 'active' : ''}`}
          onClick={() => setEditorMode('frame')}
        >
          Frame Layout
        </button>
        <button
          className={`mode-button ${editorMode === 'text' ? 'active' : ''}`}
          onClick={() => setEditorMode('text')}
        >
          Text Editor
        </button>
      </div>

      {editorMode === 'frame' ? (
        <>
          <FrameToolbar />
          <div className="main-content frame-mode">
            <FrameCanvas />
          </div>
        </>
      ) : (
        <div className="main-content">
          <div className="sidebar left-sidebar">
            <div className="panel-tabs">
              <button
                className={`panel-tab ${activePanel === 'structure' ? 'active' : ''}`}
                onClick={() => setActivePanel('structure')}
                title="Document Structure"
              >
                Structure
              </button>
              <button
                className={`panel-tab ${activePanel === 'styles' ? 'active' : ''}`}
                onClick={() => setActivePanel('styles')}
                title="Styles"
              >
                Styles
              </button>
              <button
                className={`panel-tab ${activePanel === 'variables' ? 'active' : ''}`}
                onClick={() => setActivePanel('variables')}
                title="Variables"
              >
                Variables
              </button>
              <button
                className={`panel-tab ${activePanel === 'conditions' ? 'active' : ''}`}
                onClick={() => setActivePanel('conditions')}
                title="Conditions"
              >
                Conditions
              </button>
              <button
                className={`panel-tab ${activePanel === 'index' ? 'active' : ''}`}
                onClick={() => setActivePanel('index')}
                title="Index"
              >
                Index
              </button>
            </div>
            {renderActivePanel()}
          </div>

          <div className="editor-area">
            <FormatToolbarWrapper />
            <div
              className={`document-canvas view-${viewMode}`}
              style={editorStyle}
            >
              <div className="page">
                <RichTextEditor />
              </div>
            </div>
          </div>

          <div className="sidebar right-sidebar">
            <div className="properties-panel">
              <div className="panel-header">
                <h3>Properties</h3>
              </div>
              <div className="panel-content">
                {currentDocument ? (
                  <>
                    <div className="property-group">
                      <h4>Document Info</h4>
                      <div className="property-item">
                        <label>Title:</label>
                        <span>{currentDocument.metadata.title}</span>
                      </div>
                      <div className="property-item">
                        <label>Author:</label>
                        <span>{currentDocument.metadata.author || 'Not set'}</span>
                      </div>
                      <div className="property-item">
                        <label>Version:</label>
                        <span>{currentDocument.metadata.version}</span>
                      </div>
                      <div className="property-item">
                        <label>Language:</label>
                        <span>{currentDocument.metadata.language}</span>
                      </div>
                    </div>
                    <div className="property-group">
                      <h4>Page Setup</h4>
                      <div className="property-item">
                        <label>Master Page:</label>
                        <span>{currentDocument.masterPages[0]?.name || 'Default'}</span>
                      </div>
                      <div className="property-item">
                        <label>Page Size:</label>
                        <span>Letter (8.5" × 11")</span>
                      </div>
                      <div className="property-item">
                        <label>Margins:</label>
                        <span>1" all sides</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>No document selected</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <StatusBar />

      {/* Dialogs */}
      <InsertTableDialog
        onInsert={(rows, cols) => {
          console.log('Insert table:', rows, cols);
        }}
      />
      <InsertImageDialog
        onInsert={(url, alt) => {
          console.log('Insert image:', url, alt);
        }}
      />
      <ExportDialog />
      <FindReplaceDialog />
    </div>
  );
}

// Wrapper component to provide Slate context for FormatToolbar
const FormatToolbarWrapper: React.FC = () => {
  const { currentDocument } = useDocumentStore();
  const editor = React.useMemo(() => withHistory(withReact(createEditor())), []);

  if (!currentDocument) return null;

  return (
    <Slate editor={editor} initialValue={currentDocument.content}>
      <FormatToolbar />
    </Slate>
  );
};

export default App;
