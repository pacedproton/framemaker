// FrameMaker Web Clone - Main Application
import { useState, useRef, useEffect } from 'react';
import './App.css';
import { useStore, store } from './document/store';
import { MainToolbar } from './ui/toolbars/MainToolbar';
import { FormatToolbar } from './ui/toolbars/FormatToolbar';
import { Ruler, RulerCorner } from './ui/Ruler';
import { StatusBar } from './ui/StatusBar';
import { PageRenderer } from './render/PageRenderer';
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (e.key === 'v' && !e.ctrlKey && !e.metaKey && !state.editingFrameId) {
        store.setActiveTool('select');
      }
      if (e.key === 't' && !e.ctrlKey && !e.metaKey && !state.editingFrameId) {
        store.setActiveTool('text');
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.editingFrameId, state.zoom]);

  // Handle mouse events for frame drawing
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (state.activeTool !== 'textFrame') return;
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setDrawState(startDrawing(drawState, x, y));
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!drawState.isDrawing) return;
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setDrawState(updateDrawing(drawState, x, y));
  };

  const handleCanvasMouseUp = () => {
    if (!drawState.isDrawing) return;

    const newFrame = createTextFrameFromDrawing(drawState, currentPage.id);
    if (newFrame) {
      // Snap to grid if enabled
      if (state.document.settings.snapToGrid) {
        const gridSize = state.document.settings.gridSpacing;
        newFrame.x = snapToGrid(newFrame.x, gridSize);
        newFrame.y = snapToGrid(newFrame.y, gridSize);
        newFrame.width = snapToGrid(newFrame.width, gridSize);
        newFrame.height = snapToGrid(newFrame.height, gridSize);
      }

      store.addTextFrame(newFrame);
      store.setActiveTool('text');
    }

    setDrawState(endDrawing(drawState));
  };

  const drawingRect = getDrawingRect(drawState);

  return (
    <div className="fm-app">
      <header className="fm-menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">Format</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Special</div>
        <div className="menu-item">Graphics</div>
        <div className="menu-item">Table</div>
      </header>

      <MainToolbar />
      <FormatToolbar />

      <div className="fm-workspace">
        <RulerCorner />
        <Ruler orientation="horizontal" />

        <div className="fm-main-area">
          <Ruler orientation="vertical" />

          <div className="fm-canvas-container">
            <div
              className="fm-canvas"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <div
                ref={canvasRef}
                className="fm-pasteboard"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                <PageRenderer page={currentPage} scale={1} />

                {/* Drawing preview */}
                {drawingRect && (
                  <div
                    className="fm-drawing-preview"
                    style={{
                      position: 'absolute',
                      left: `${48 + drawingRect.x}px`,
                      top: `${48 + drawingRect.y}px`,
                      width: `${drawingRect.width}px`,
                      height: `${drawingRect.height}px`,
                      border: '2px dashed #2563eb',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
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
    </div>
  );
}

export default App;
