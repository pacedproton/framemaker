import React, { useRef, useState } from 'react';
import { useFrameStore } from '../../store/frameStore';
import type { Frame } from '../../types/frame';
import { createTextFrame, createGraphicFrame, createUnanchoredFrame } from '../../types/frame';
import FrameComponent from './FrameComponent';
import './FrameCanvas.css';

const FrameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    pages,
    currentPageIndex,
    selectedFrameId,
    tool,
    showGrid,
    gridSize,
    zoom,
    addFrame,
    selectFrame,
    setTool,
  } = useFrameStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawRect, setDrawRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const currentPage = pages[currentPageIndex];
  if (!currentPage) return null;

  const scale = zoom / 100;

  const getCanvasCoords = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    return { x, y };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;

    const coords = getCanvasCoords(e);

    if (tool === 'select') {
      selectFrame(null);
    } else if (tool === 'text-frame' || tool === 'graphic-frame' || tool === 'unanchored-frame') {
      setIsDrawing(true);
      setDrawStart(coords);
      setDrawRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);

    if (isDrawing) {
      const x = Math.min(drawStart.x, coords.x);
      const y = Math.min(drawStart.y, coords.y);
      const width = Math.abs(coords.x - drawStart.x);
      const height = Math.abs(coords.y - drawStart.y);
      setDrawRect({ x, y, width, height });
    }
  };

  const handleCanvasMouseUp = (_e: React.MouseEvent) => {
    if (isDrawing) {
      setIsDrawing(false);

      if (drawRect.width > 20 && drawRect.height > 20) {
        let newFrame: Frame;
        if (tool === 'text-frame') {
          newFrame = createTextFrame(drawRect.x, drawRect.y, drawRect.width, drawRect.height);
        } else if (tool === 'graphic-frame') {
          newFrame = createGraphicFrame(drawRect.x, drawRect.y, drawRect.width, drawRect.height);
        } else {
          newFrame = createUnanchoredFrame(drawRect.x, drawRect.y, drawRect.width, drawRect.height);
        }
        addFrame(newFrame);
        setTool('select');
      }

      setDrawRect({ x: 0, y: 0, width: 0, height: 0 });
    }
  };

  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const scaledGridSize = gridSize;

    // Vertical lines
    for (let x = 0; x <= currentPage.width; x += scaledGridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={currentPage.height}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= currentPage.height; y += scaledGridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={currentPage.width}
          y2={y}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }

    return (
      <svg
        className="grid-overlay"
        width={currentPage.width}
        height={currentPage.height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {lines}
      </svg>
    );
  };

  const sortedFrames = [...currentPage.frames].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="frame-canvas-container">
      <div
        className="frame-canvas-wrapper"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <div
          ref={canvasRef}
          className={`frame-canvas tool-${tool}`}
          style={{
            width: currentPage.width,
            height: currentPage.height,
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => {
            if (isDrawing) {
              setIsDrawing(false);
              setDrawRect({ x: 0, y: 0, width: 0, height: 0 });
            }
          }}
        >
          {renderGrid()}

          {sortedFrames.map((frame) => (
            <FrameComponent
              key={frame.id}
              frame={frame}
              isSelected={frame.id === selectedFrameId}
              scale={scale}
            />
          ))}

          {isDrawing && drawRect.width > 0 && drawRect.height > 0 && (
            <div
              className="drawing-rect"
              style={{
                left: drawRect.x,
                top: drawRect.y,
                width: drawRect.width,
                height: drawRect.height,
              }}
            />
          )}
        </div>
      </div>

      <div className="canvas-info">
        Page {currentPage.pageNumber} | {currentPage.frames.length} frames | Zoom: {zoom}%
      </div>
    </div>
  );
};

export default FrameCanvas;
