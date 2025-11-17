// Main Canvas Component - Frame-Based Editor
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { store, useStore } from '../core/store';
import { FrameRenderer } from '../renderer/FrameRenderer';
import type { Frame, TextFrame, MathFrame } from '../core/types';

interface DragState {
  isDragging: boolean;
  frameId: string | null;
  startX: number;
  startY: number;
  frameStartX: number;
  frameStartY: number;
}

interface ResizeState {
  isResizing: boolean;
  frameId: string | null;
  handle: string;
  startX: number;
  startY: number;
  frameStartX: number;
  frameStartY: number;
  frameStartWidth: number;
  frameStartHeight: number;
}

interface DrawState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FrameRenderer | null>(null);
  const state = useStore();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    frameId: null,
    startX: 0,
    startY: 0,
    frameStartX: 0,
    frameStartY: 0,
  });

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    frameId: null,
    handle: '',
    startX: 0,
    startY: 0,
    frameStartX: 0,
    frameStartY: 0,
    frameStartWidth: 0,
    frameStartHeight: 0,
  });

  const [drawState, setDrawState] = useState<DrawState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const scale = state.zoom / 100;
  const page = state.document.pages[state.currentPageIndex];

  // Initialize renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new FrameRenderer(canvasRef.current);
    }
  }, []);

  // Render frames
  useEffect(() => {
    if (rendererRef.current && page) {
      rendererRef.current.setScale(scale);
      rendererRef.current.render(page, state.showGrid, state.showMargins, state.showFrameBorders);

      // Render selection on overlay canvas
      if (overlayCanvasRef.current && state.selectedFrameId) {
        const selectedFrame = page.frames.find((f) => f.id === state.selectedFrameId);
        if (selectedFrame) {
          const ctx = overlayCanvasRef.current.getContext('2d');
          if (ctx) {
            overlayCanvasRef.current.width = page.width * scale;
            overlayCanvasRef.current.height = page.height * scale;
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
            rendererRef.current.renderSelection(selectedFrame);
          }
        }
      } else if (overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
      }
    }
  }, [state, page, scale]);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      return { x, y };
    },
    [scale]
  );

  const getFrameAtPoint = useCallback(
    (x: number, y: number): Frame | null => {
      // Check frames from top to bottom (highest z-index first)
      const sortedFrames = [...page.frames].sort((a, b) => b.zIndex - a.zIndex);
      for (const frame of sortedFrames) {
        if (x >= frame.x && x <= frame.x + frame.width && y >= frame.y && y <= frame.y + frame.height) {
          return frame;
        }
      }
      return null;
    },
    [page.frames]
  );

  const getResizeHandle = useCallback(
    (frame: Frame, x: number, y: number): string => {
      const handleSize = 8 / scale;
      const handles = [
        { id: 'nw', x: frame.x, y: frame.y },
        { id: 'n', x: frame.x + frame.width / 2, y: frame.y },
        { id: 'ne', x: frame.x + frame.width, y: frame.y },
        { id: 'e', x: frame.x + frame.width, y: frame.y + frame.height / 2 },
        { id: 'se', x: frame.x + frame.width, y: frame.y + frame.height },
        { id: 's', x: frame.x + frame.width / 2, y: frame.y + frame.height },
        { id: 'sw', x: frame.x, y: frame.y + frame.height },
        { id: 'w', x: frame.x, y: frame.y + frame.height / 2 },
      ];

      for (const handle of handles) {
        if (
          Math.abs(x - handle.x) <= handleSize &&
          Math.abs(y - handle.y) <= handleSize
        ) {
          return handle.id;
        }
      }
      return '';
    },
    [scale]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    const tool = state.activeTool;

    if (tool === 'select') {
      // Check if clicking on resize handle
      if (state.selectedFrameId) {
        const selectedFrame = page.frames.find((f) => f.id === state.selectedFrameId);
        if (selectedFrame) {
          const handle = getResizeHandle(selectedFrame, coords.x, coords.y);
          if (handle) {
            setResizeState({
              isResizing: true,
              frameId: selectedFrame.id,
              handle,
              startX: coords.x,
              startY: coords.y,
              frameStartX: selectedFrame.x,
              frameStartY: selectedFrame.y,
              frameStartWidth: selectedFrame.width,
              frameStartHeight: selectedFrame.height,
            });
            return;
          }
        }
      }

      // Check if clicking on a frame
      const frame = getFrameAtPoint(coords.x, coords.y);
      if (frame) {
        store.selectFrame(frame.id);
        if (!frame.locked) {
          setDragState({
            isDragging: true,
            frameId: frame.id,
            startX: coords.x,
            startY: coords.y,
            frameStartX: frame.x,
            frameStartY: frame.y,
          });
        }
      } else {
        store.selectFrame(null);
      }
    } else if (
      tool === 'text-frame' ||
      tool === 'math-frame' ||
      tool === 'graphic-frame' ||
      tool === 'table-frame'
    ) {
      setDrawState({
        isDrawing: true,
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);

    if (dragState.isDragging && dragState.frameId) {
      const dx = coords.x - dragState.startX;
      const dy = coords.y - dragState.startY;
      const newX = store.snapToGrid(dragState.frameStartX + dx);
      const newY = store.snapToGrid(dragState.frameStartY + dy);
      store.moveFrame(dragState.frameId, newX, newY);
    } else if (resizeState.isResizing && resizeState.frameId) {
      const dx = coords.x - resizeState.startX;
      const dy = coords.y - resizeState.startY;

      let newX = resizeState.frameStartX;
      let newY = resizeState.frameStartY;
      let newWidth = resizeState.frameStartWidth;
      let newHeight = resizeState.frameStartHeight;

      switch (resizeState.handle) {
        case 'nw':
          newX = store.snapToGrid(resizeState.frameStartX + dx);
          newY = store.snapToGrid(resizeState.frameStartY + dy);
          newWidth = resizeState.frameStartWidth - dx;
          newHeight = resizeState.frameStartHeight - dy;
          break;
        case 'n':
          newY = store.snapToGrid(resizeState.frameStartY + dy);
          newHeight = resizeState.frameStartHeight - dy;
          break;
        case 'ne':
          newY = store.snapToGrid(resizeState.frameStartY + dy);
          newWidth = store.snapToGrid(resizeState.frameStartWidth + dx);
          newHeight = resizeState.frameStartHeight - dy;
          break;
        case 'e':
          newWidth = store.snapToGrid(resizeState.frameStartWidth + dx);
          break;
        case 'se':
          newWidth = store.snapToGrid(resizeState.frameStartWidth + dx);
          newHeight = store.snapToGrid(resizeState.frameStartHeight + dy);
          break;
        case 's':
          newHeight = store.snapToGrid(resizeState.frameStartHeight + dy);
          break;
        case 'sw':
          newX = store.snapToGrid(resizeState.frameStartX + dx);
          newWidth = resizeState.frameStartWidth - dx;
          newHeight = store.snapToGrid(resizeState.frameStartHeight + dy);
          break;
        case 'w':
          newX = store.snapToGrid(resizeState.frameStartX + dx);
          newWidth = resizeState.frameStartWidth - dx;
          break;
      }

      store.setFramePosition(resizeState.frameId, newX, newY, newWidth, newHeight);
    } else if (drawState.isDrawing) {
      setDrawState((prev) => ({
        ...prev,
        currentX: coords.x,
        currentY: coords.y,
      }));
    }

    // Update cursor
    if (state.activeTool === 'select' && state.selectedFrameId) {
      const selectedFrame = page.frames.find((f) => f.id === state.selectedFrameId);
      if (selectedFrame) {
        const handle = getResizeHandle(selectedFrame, coords.x, coords.y);
        if (handle) {
          const cursors: Record<string, string> = {
            nw: 'nw-resize',
            n: 'n-resize',
            ne: 'ne-resize',
            e: 'e-resize',
            se: 'se-resize',
            s: 's-resize',
            sw: 'sw-resize',
            w: 'w-resize',
          };
          if (containerRef.current) {
            containerRef.current.style.cursor = cursors[handle] || 'default';
          }
          return;
        }
      }
    }

    // Default cursors
    if (containerRef.current) {
      const cursors: Record<string, string> = {
        select: 'default',
        'text-frame': 'crosshair',
        'math-frame': 'crosshair',
        'graphic-frame': 'crosshair',
        'table-frame': 'crosshair',
        pan: 'grab',
        zoom: 'zoom-in',
      };
      containerRef.current.style.cursor = cursors[state.activeTool] || 'default';
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        frameId: null,
        startX: 0,
        startY: 0,
        frameStartX: 0,
        frameStartY: 0,
      });
    }

    if (resizeState.isResizing) {
      setResizeState({
        isResizing: false,
        frameId: null,
        handle: '',
        startX: 0,
        startY: 0,
        frameStartX: 0,
        frameStartY: 0,
        frameStartWidth: 0,
        frameStartHeight: 0,
      });
    }

    if (drawState.isDrawing) {
      const x = Math.min(drawState.startX, drawState.currentX);
      const y = Math.min(drawState.startY, drawState.currentY);
      const width = Math.abs(drawState.currentX - drawState.startX);
      const height = Math.abs(drawState.currentY - drawState.startY);

      if (width > 20 && height > 20) {
        const tool = state.activeTool;
        let frameType: 'text' | 'math' | 'graphic' | 'table' = 'text';

        switch (tool) {
          case 'text-frame':
            frameType = 'text';
            break;
          case 'math-frame':
            frameType = 'math';
            break;
          case 'graphic-frame':
            frameType = 'graphic';
            break;
          case 'table-frame':
            frameType = 'table';
            break;
        }

        store.addFrame(
          frameType,
          store.snapToGrid(x),
          store.snapToGrid(y),
          store.snapToGrid(width),
          store.snapToGrid(height)
        );
        store.setTool('select');
      }

      setDrawState({
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    const frame = getFrameAtPoint(coords.x, coords.y);

    if (frame) {
      if (frame.type === 'text') {
        const textFrame = frame as TextFrame;
        const text = textFrame.content.map((run) => run.text).join('');
        setEditText(text);
        setEditingFrameId(frame.id);
      } else if (frame.type === 'math') {
        const mathFrame = frame as MathFrame;
        setEditText(mathFrame.latex);
        setEditingFrameId(frame.id);
      }
    }
  };

  const handleEditSave = () => {
    if (editingFrameId) {
      const frame = page.frames.find((f) => f.id === editingFrameId);
      if (frame) {
        if (frame.type === 'text') {
          store.setTextContent(editingFrameId, [
            {
              id: `run_${Date.now()}`,
              text: editText,
              style: {
                fontFamily: 'Times New Roman',
                fontSize: 12,
                fontWeight: 'normal',
                fontStyle: 'normal',
                textDecoration: 'none',
                color: '#000000',
              },
            },
          ]);
        } else if (frame.type === 'math') {
          store.setMathLatex(editingFrameId, editText);
        }
      }
    }
    setEditingFrameId(null);
    setEditText('');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingFrameId) return;

      switch (e.key) {
        case 'v':
        case 'V':
          store.setTool('select');
          break;
        case 't':
        case 'T':
          store.setTool('text-frame');
          break;
        case 'm':
        case 'M':
          store.setTool('math-frame');
          break;
        case 'g':
        case 'G':
          store.setTool('graphic-frame');
          break;
        case 'b':
        case 'B':
          store.setTool('table-frame');
          break;
        case 'h':
        case 'H':
          store.setTool('pan');
          break;
        case 'Delete':
        case 'Backspace':
          if (state.selectedFrameId) {
            store.removeFrame(state.selectedFrameId);
          }
          break;
        case 'Escape':
          store.selectFrame(null);
          store.setTool('select');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedFrameId, editingFrameId]);

  return (
    <div className="canvas-container">
      <div
        ref={containerRef}
        className="canvas-wrapper"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <canvas ref={canvasRef} className="main-canvas" />
        <canvas ref={overlayCanvasRef} className="overlay-canvas" />

        {/* Drawing preview */}
        {drawState.isDrawing && (
          <div
            className="draw-preview"
            style={{
              left: Math.min(drawState.startX, drawState.currentX) * scale,
              top: Math.min(drawState.startY, drawState.currentY) * scale,
              width: Math.abs(drawState.currentX - drawState.startX) * scale,
              height: Math.abs(drawState.currentY - drawState.startY) * scale,
            }}
          />
        )}
      </div>

      {/* Edit dialog */}
      {editingFrameId && (
        <div className="edit-overlay">
          <div className="edit-dialog">
            <h3>
              {page.frames.find((f) => f.id === editingFrameId)?.type === 'math'
                ? 'Edit Math (LaTeX)'
                : 'Edit Text'}
            </h3>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder={
                page.frames.find((f) => f.id === editingFrameId)?.type === 'math'
                  ? 'Enter LaTeX: e.g., \\frac{a}{b}, \\sqrt{x}, E=mc^2'
                  : 'Enter text content...'
              }
              rows={10}
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={handleEditSave}>Save</button>
              <button onClick={() => setEditingFrameId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="canvas-status">
        {state.activeTool !== 'select' && (
          <span className="status-hint">
            Click and drag to draw a {state.activeTool.replace('-', ' ')}
          </span>
        )}
        {state.selectedFrameId && (
          <span className="status-selected">
            Selected: {page.frames.find((f) => f.id === state.selectedFrameId)?.type} frame
          </span>
        )}
      </div>
    </div>
  );
};
