// Graphic Frame Renderer - renders vector graphics (lines, rectangles, ellipses)
import React, { useState, useRef, useEffect } from 'react';
import type { GraphicFrame } from '../document/types';
import { store, useStore } from '../document/store';

interface GraphicFrameRendererProps {
  frame: GraphicFrame;
  scale: number;
}

export const GraphicFrameRenderer: React.FC<GraphicFrameRendererProps> = ({ frame, scale }) => {
  const state = useStore();
  const isSelected = state.selectedFrameIds.includes(frame.id);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, frameX: 0, frameY: 0, frameW: 0, frameH: 0 });

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.activeTool === 'select') {
      e.preventDefault();
      e.stopPropagation();

      // Select this frame
      store.selectFrame(frame.id);

      // Start dragging
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        frameX: frame.x,
        frameY: frame.y,
        frameW: frame.width,
        frameH: frame.height,
      };
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;

      if (isDragging) {
        store.moveFrame(frame.id, dragStart.current.frameX + dx, dragStart.current.frameY + dy);
      } else if (isResizing) {
        let newX = dragStart.current.frameX;
        let newY = dragStart.current.frameY;
        let newW = dragStart.current.frameW;
        let newH = dragStart.current.frameH;

        // Handle different resize handles
        if (isResizing.includes('e')) newW = dragStart.current.frameW + dx;
        if (isResizing.includes('w')) {
          newX = dragStart.current.frameX + dx;
          newW = dragStart.current.frameW - dx;
        }
        if (isResizing.includes('s')) newH = dragStart.current.frameH + dy;
        if (isResizing.includes('n')) {
          newY = dragStart.current.frameY + dy;
          newH = dragStart.current.frameH - dy;
        }

        // Minimum size
        newW = Math.max(10, newW);
        newH = Math.max(10, newH);

        store.moveFrame(frame.id, newX, newY);
        store.resizeFrame(frame.id, newW, newH);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, frame.id, scale]);

  // Handle resize handle mouse down
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(handle);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      frameX: frame.x,
      frameY: frame.y,
      frameW: frame.width,
      frameH: frame.height,
    };
  };

  // Render the graphic based on type
  const renderGraphic = () => {
    const strokeDasharray =
      frame.lineStyle === 'dashed' ? '8,4' :
      frame.lineStyle === 'dotted' ? '2,2' :
      'none';

    switch (frame.graphicType) {
      case 'line':
        return (
          <svg
            width={frame.width}
            height={frame.height}
            style={{ overflow: 'visible' }}
          >
            <line
              x1={0}
              y1={0}
              x2={frame.width}
              y2={frame.height}
              stroke={frame.strokeColor}
              strokeWidth={frame.lineWidth}
              strokeDasharray={strokeDasharray}
            />
            {frame.arrowStart && (
              <polygon
                points="0,0 8,-4 8,4"
                fill={frame.strokeColor}
              />
            )}
            {frame.arrowEnd && (
              <polygon
                points={`${frame.width},${frame.height} ${frame.width - 8},${frame.height - 4} ${frame.width - 8},${frame.height + 4}`}
                fill={frame.strokeColor}
              />
            )}
          </svg>
        );

      case 'rectangle':
        return (
          <svg
            width={frame.width}
            height={frame.height}
          >
            <rect
              x={frame.lineWidth / 2}
              y={frame.lineWidth / 2}
              width={frame.width - frame.lineWidth}
              height={frame.height - frame.lineWidth}
              fill={frame.fillColor}
              stroke={frame.strokeColor}
              strokeWidth={frame.lineWidth}
              strokeDasharray={strokeDasharray}
              rx={frame.cornerRadius}
              ry={frame.cornerRadius}
            />
          </svg>
        );

      case 'ellipse':
        return (
          <svg
            width={frame.width}
            height={frame.height}
          >
            <ellipse
              cx={frame.width / 2}
              cy={frame.height / 2}
              rx={frame.width / 2 - frame.lineWidth / 2}
              ry={frame.height / 2 - frame.lineWidth / 2}
              fill={frame.fillColor}
              stroke={frame.strokeColor}
              strokeWidth={frame.lineWidth}
              strokeDasharray={strokeDasharray}
            />
          </svg>
        );

      default:
        return null;
    }
  };

  const frameStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${frame.x}px`,
    top: `${frame.y}px`,
    width: `${frame.width}px`,
    height: `${frame.height}px`,
    transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    cursor: state.activeTool === 'select' ? 'move' : 'default',
    outline: isSelected ? '2px solid #0066ff' : 'none',
    pointerEvents: 'auto',
  };

  return (
    <div
      className={`fm-graphic-frame ${isSelected ? 'selected' : ''}`}
      style={frameStyle}
      onMouseDown={handleMouseDown}
    >
      {renderGraphic()}

      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <div
            className="resize-handle nw"
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              width: 8,
              height: 8,
              background: 'white',
              border: '1px solid #0066ff',
              cursor: 'nwse-resize',
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <div
            className="resize-handle ne"
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 8,
              height: 8,
              background: 'white',
              border: '1px solid #0066ff',
              cursor: 'nesw-resize',
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div
            className="resize-handle sw"
            style={{
              position: 'absolute',
              bottom: -4,
              left: -4,
              width: 8,
              height: 8,
              background: 'white',
              border: '1px solid #0066ff',
              cursor: 'nesw-resize',
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div
            className="resize-handle se"
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 8,
              height: 8,
              background: 'white',
              border: '1px solid #0066ff',
              cursor: 'nwse-resize',
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
        </>
      )}
    </div>
  );
};
