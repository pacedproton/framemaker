// FrameMaker Web Clone - Main Application
import { useState, useRef, useEffect } from 'react';
import './App.css';
import { useStore, store } from './document/store';
import { MenuBar, AppTitleBar } from './ui/MenuBar';
import { MainToolbar } from './ui/toolbars/MainToolbar';
import { FormatToolbar } from './ui/toolbars/FormatToolbar';
import { Ruler, RulerCorner } from './ui/Ruler';
import { StatusBar } from './ui/StatusBar';
import { PageRenderer } from './render/PageRenderer';
import { ToolPalette } from './ui/ToolPalette';
import { EquationDialog } from './ui/EquationDialog';
import { TableDialog } from './ui/TableDialog';
import { ImageDialog } from './ui/ImageDialog';
import { CharacterDialog } from './ui/CharacterDialog';
import { FindReplaceDialog } from './ui/FindReplaceDialog';
import { DocumentStatsDialog } from './ui/DocumentStatsDialog';
import { ParagraphDesigner } from './ui/ParagraphDesigner';
import { ParagraphCatalog } from './ui/ParagraphCatalog';
import { CharacterCatalog } from './ui/CharacterCatalog';
import {
  createDrawingState,
  startDrawing,
  updateDrawing,
  endDrawing,
  getDrawingRect,
  createTextFrameFromDrawing,
  snapToGrid,
} from './engine/FrameDrawing';

function App() {
  const state = useStore();
  const currentPage = state.document.pages[state.currentPageIndex];
  const scale = state.zoom / 100;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drawState, setDrawState] = useState(createDrawingState());
  const [showToolPalette, setShowToolPalette] = useState(false);
  const [showEquationDialog, setShowEquationDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showCharacterDialog, setShowCharacterDialog] = useState(false);
  const [showFindReplaceDialog, setShowFindReplaceDialog] = useState(false);
  const [showDocumentStatsDialog, setShowDocumentStatsDialog] = useState(false);
  const [showParagraphDesigner, setShowParagraphDesigner] = useState(false);
  const [showParagraphCatalog, setShowParagraphCatalog] = useState(false);
  const [showCharacterCatalog, setShowCharacterCatalog] = useState(false);

  // Listen for custom events
  useEffect(() => {
    const handleToggleToolPalette = () => setShowToolPalette((v) => !v);
    const handleShowTableDialog = () => setShowTableDialog(true);
    const handleShowImageDialog = () => setShowImageDialog(true);
    const handleShowCharacterDialog = () => setShowCharacterDialog(true);
    const handleShowFindReplaceDialog = () => setShowFindReplaceDialog(true);
    const handleShowDocumentStatsDialog = () => setShowDocumentStatsDialog(true);
    const handleShowParagraphDesigner = () => setShowParagraphDesigner(true);
    const handleToggleParagraphCatalog = () => setShowParagraphCatalog((v) => !v);
    const handleToggleCharacterCatalog = () => setShowCharacterCatalog((v) => !v);
    window.addEventListener('toggleToolPalette', handleToggleToolPalette);
    window.addEventListener('showTableDialog', handleShowTableDialog);
    window.addEventListener('showImageDialog', handleShowImageDialog);
    window.addEventListener('showCharacterDialog', handleShowCharacterDialog);
    window.addEventListener('showFindReplaceDialog', handleShowFindReplaceDialog);
    window.addEventListener('showDocumentStatsDialog', handleShowDocumentStatsDialog);
    window.addEventListener('showParagraphDesigner', handleShowParagraphDesigner);
    window.addEventListener('toggleParagraphCatalog', handleToggleParagraphCatalog);
    window.addEventListener('toggleCharacterCatalog', handleToggleCharacterCatalog);
    return () => {
      window.removeEventListener('toggleToolPalette', handleToggleToolPalette);
      window.removeEventListener('showTableDialog', handleShowTableDialog);
      window.removeEventListener('showImageDialog', handleShowImageDialog);
      window.removeEventListener('showCharacterDialog', handleShowCharacterDialog);
      window.removeEventListener('showFindReplaceDialog', handleShowFindReplaceDialog);
      window.removeEventListener('showDocumentStatsDialog', handleShowDocumentStatsDialog);
      window.removeEventListener('showParagraphDesigner', handleShowParagraphDesigner);
      window.removeEventListener('toggleParagraphCatalog', handleToggleParagraphCatalog);
      window.removeEventListener('toggleCharacterCatalog', handleToggleCharacterCatalog);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't process shortcuts when editing text
      if (state.editingFrameId) return;

      // Tool shortcuts
      if (e.key === 'v' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        store.setActiveTool('select');
      }
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        store.setActiveTool('text');
      }
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        store.setActiveTool('textFrame');
      }
      if (e.key === 'l' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        store.setActiveTool('line');
      }
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        store.setActiveTool('rectangle');
      }
      if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        store.setActiveTool('ellipse');
      }

      // Zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        store.setZoom(state.zoom + 25);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        store.setZoom(state.zoom - 25);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        store.setZoom(100);
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        store.redo();
      }

      // Equation dialog
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setShowEquationDialog(true);
      }

      // Find/Replace dialog
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindReplaceDialog(true);
      }

      // Delete selected frame
      if (e.key === 'Delete' && state.selectedFrameIds.length > 0) {
        state.selectedFrameIds.forEach((id) => store.deleteFrame(id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.editingFrameId, state.zoom, state.selectedFrameIds]);

  // Handle mouse events for frame drawing
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const graphicTools = ['textFrame', 'line', 'rectangle', 'ellipse'];
    if (!graphicTools.includes(state.activeTool)) return;
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - 40) / scale; // -40 for pasteboard padding
    const y = (e.clientY - rect.top - 40) / scale;

    setDrawState(startDrawing(drawState, x, y));
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!drawState.isDrawing) return;
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - 40) / scale;
    const y = (e.clientY - rect.top - 40) / scale;

    setDrawState(updateDrawing(drawState, x, y));
  };

  const handleCanvasMouseUp = () => {
    if (!drawState.isDrawing) return;

    const rect = getDrawingRect(drawState);
    if (!rect || (rect.width < 5 && rect.height < 5)) {
      setDrawState(endDrawing(drawState));
      return;
    }

    let x = rect.x;
    let y = rect.y;
    let width = rect.width;
    let height = rect.height;

    // Snap to grid if enabled
    if (state.document.settings.snapToGrid) {
      const gridSize = state.document.settings.gridSpacing;
      x = snapToGrid(x, gridSize);
      y = snapToGrid(y, gridSize);
      width = snapToGrid(width, gridSize);
      height = snapToGrid(height, gridSize);
    }

    // Create appropriate frame based on active tool
    if (state.activeTool === 'textFrame') {
      const newFrame = createTextFrameFromDrawing(drawState, currentPage.id);
      if (newFrame) {
        newFrame.x = x;
        newFrame.y = y;
        newFrame.width = width;
        newFrame.height = height;
        store.addTextFrame(newFrame);
        store.setActiveTool('text');
      }
    } else if (state.activeTool === 'line') {
      store.addGraphicFrame('line', x, y, width, height);
      store.setActiveTool('select');
    } else if (state.activeTool === 'rectangle') {
      store.addGraphicFrame('rectangle', x, y, width, height);
      store.setActiveTool('select');
    } else if (state.activeTool === 'ellipse') {
      store.addGraphicFrame('ellipse', x, y, width, height);
      store.setActiveTool('select');
    }

    setDrawState(endDrawing(drawState));
  };

  const drawingRect = getDrawingRect(drawState);

  const handleEquationInsert = (latex: string) => {
    // Insert equation as inline element
    if (state.editingFrameId) {
      store.insertEquation(latex, 14);
    }
    setShowEquationDialog(false);
  };

  const handleTableInsert = (rows: number, cols: number, title: string) => {
    // Insert table inline
    if (state.editingFrameId) {
      store.insertTable(rows, cols, title);
    }
    setShowTableDialog(false);
  };

  const handleImageInsert = (imageUrl: string, altText: string) => {
    // Add image frame to page
    store.addImageFrame(imageUrl, altText);
    setShowImageDialog(false);
  };

  return (
    <div className="fm-app">
      <AppTitleBar />
      <MenuBar />

      <MainToolbar />
      <FormatToolbar />

      <div className="fm-workspace">
        <RulerCorner />
        <Ruler orientation="horizontal" />

        <Ruler orientation="vertical" />

        <div className="fm-canvas-container">
          <div
            ref={canvasRef}
            className="fm-canvas"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            <div
              className="fm-canvas-scaler"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <div className="fm-pasteboard">
                <PageRenderer page={currentPage} scale={1} />

                {/* Drawing preview */}
                {drawingRect && (
                  <div
                    className="fm-drawing-preview"
                    style={{
                      position: 'absolute',
                      left: `${drawingRect.x}px`,
                      top: `${drawingRect.y}px`,
                      width: `${drawingRect.width}px`,
                      height: `${drawingRect.height}px`,
                      border: '1px dashed #000080',
                      backgroundColor: 'transparent',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusBar />

      {/* Floating Palettes */}
      <ToolPalette visible={showToolPalette} onClose={() => setShowToolPalette(false)} />

      {/* Dialogs */}
      <EquationDialog
        visible={showEquationDialog}
        onClose={() => setShowEquationDialog(false)}
        onInsert={handleEquationInsert}
      />
      <TableDialog
        visible={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onInsert={handleTableInsert}
      />
      <ImageDialog
        visible={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onInsert={handleImageInsert}
      />
      <CharacterDialog
        visible={showCharacterDialog}
        onClose={() => setShowCharacterDialog(false)}
      />
      <FindReplaceDialog
        visible={showFindReplaceDialog}
        onClose={() => setShowFindReplaceDialog(false)}
      />
      <DocumentStatsDialog
        visible={showDocumentStatsDialog}
        onClose={() => setShowDocumentStatsDialog(false)}
      />
      <ParagraphDesigner
        visible={showParagraphDesigner}
        onClose={() => setShowParagraphDesigner(false)}
      />
      <ParagraphCatalog
        visible={showParagraphCatalog}
        onClose={() => setShowParagraphCatalog(false)}
      />
      <CharacterCatalog
        visible={showCharacterCatalog}
        onClose={() => setShowCharacterCatalog(false)}
      />
    </div>
  );
}

export default App;
