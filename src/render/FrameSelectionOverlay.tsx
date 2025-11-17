// Frame Selection Overlay - shows selection handles and allows dragging
import React, { useState, useRef, useEffect } from 'react';
import type { Frame } from '../document/types';
import { store, useStore } from '../document/store';

interface FrameSelectionOverlayProps {
  frame: Frame;
  scale: number;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const FrameSelectionOverlay: React.FC<FrameSelectionOverlayProps> = ({ frame, scale }) => {
  const state = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, frameX: 0, frameY: 0, frameW: 0, frameH: 0 });

  const isSelected = state.selectedFrameIds.includes(frame.id);

  // Global mouse move/up handlers for drag and resize
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.mouseX) / scale;
      const dy = (e.clientY - dragStart.current.mouseY) / scale;

      if (isDragging) {
        store.moveFrame(frame.id, dragStart.current.frameX + dx, dragStart.current.frameY + dy);
      } else if (isResizing) {
        let newX = dragStart.current.frameX;
        let newY = dragStart.current.frameY;
        let newW = dragStart.current.frameW;
        let newH = dragStart.current.frameH;

        // Handle resize based on which handle is being dragged
        if (isResizing.includes('e')) newW = Math.max(50, dragStart.current.frameW + dx);
        if (isResizing.includes('w')) {
          newX = dragStart.current.frameX + dx;
          newW = Math.max(50, dragStart.current.frameW - dx);
        }
        if (isResizing.includes('s')) newH = Math.max(50, dragStart.current.frameH + dy);
        if (isResizing.includes('n')) {
          newY = dragStart.current.frameY + dy;
          newH = Math.max(50, dragStart.current.frameH - dy);
        }

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

  if (!isSelected) return null;

  const handleSize = 8;

  // Handle positions relative to frame
  const handles: { handle: ResizeHandle; x: number; y: number; cursor: string }[] = [
    { handle: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
    { handle: 'n', x: frame.width / 2, y: 0, cursor: 'ns-resize' },
    { handle: 'ne', x: frame.width, y: 0, cursor: 'nesw-resize' },
    { handle: 'e', x: frame.width, y: frame.height / 2, cursor: 'ew-resize' },
    { handle: 'se', x: frame.width, y: frame.height, cursor: 'nwse-resize' },
    { handle: 's', x: frame.width / 2, y: frame.height, cursor: 'ns-resize' },
    { handle: 'sw', x: 0, y: frame.height, cursor: 'nesw-resize' },
    { handle: 'w', x: 0, y: frame.height / 2, cursor: 'ew-resize' },
  ];

  const handleFrameMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      frameX: frame.x,
      frameY: frame.y,
      frameW: frame.width,
      frameH: frame.height,
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(handle);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      frameX: frame.x,
      frameY: frame.y,
      frameW: frame.width,
      frameH: frame.height,
    };
  };

  return (
    <div
      className="fm-frame-selection"
      style={{
        position: 'absolute',
        left: `${frame.x}px`,
        top: `${frame.y}px`,
        width: `${frame.width}px`,
        height: `${frame.height}px`,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Draggable selection border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '2px solid #2563eb',
          pointerEvents: 'all',
          cursor: isDragging ? 'grabbing' : 'move',
        }}
        onMouseDown={handleFrameMouseDown}
      />

      {/* Resize handles */}
      {handles.map((h) => (
        <div
          key={h.handle}
          style={{
            position: 'absolute',
            left: `${h.x - handleSize / 2}px`,
            top: `${h.y - handleSize / 2}px`,
            width: `${handleSize}px`,
            height: `${handleSize}px`,
            backgroundColor: 'white',
            border: '1px solid #2563eb',
            cursor: h.cursor,
            pointerEvents: 'all',
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, h.handle)}
        />
      ))}

      {/* Frame info tooltip while dragging */}
      {(isDragging || isResizing) && (
        <div
          style={{
            position: 'absolute',
            top: '-24px',
            left: '0',
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {isResizing
            ? `${Math.round(frame.width)}pt × ${Math.round(frame.height)}pt`
            : `${Math.round(frame.x)}pt, ${Math.round(frame.y)}pt`}
        </div>
      )}
    </div>
  );
};
