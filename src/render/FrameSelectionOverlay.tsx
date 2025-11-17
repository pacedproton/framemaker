// Frame Selection Overlay - shows selection handles and allows dragging
import React, { useState } from 'react';
import type { Frame } from '../document/types';
import { store, useStore } from '../document/store';
import {
  createDragState,
  startDrag,
  calculateDragPosition,
  calculateResize,
  hitTestHandle,
  getHandleCursor,
  type ResizeHandle,
  type DragState,
} from '../engine/FrameSelection';

interface FrameSelectionOverlayProps {
  frame: Frame;
  scale: number;
}

export const FrameSelectionOverlay: React.FC<FrameSelectionOverlayProps> = ({ frame, scale }) => {
  const state = useStore();
  const [dragState, setDragState] = useState<DragState>(createDragState());
  const [currentHandle, setCurrentHandle] = useState<ResizeHandle | null>(null);

  const isSelected = state.selectedFrameIds.includes(frame.id);

  if (!isSelected) return null;

  const handleSize = 8;

  // Handle positions
  const handles: { handle: ResizeHandle; x: number; y: number }[] = [
    { handle: 'nw', x: frame.x * scale, y: frame.y * scale },
    { handle: 'n', x: (frame.x + frame.width / 2) * scale, y: frame.y * scale },
    { handle: 'ne', x: (frame.x + frame.width) * scale, y: frame.y * scale },
    { handle: 'e', x: (frame.x + frame.width) * scale, y: (frame.y + frame.height / 2) * scale },
    { handle: 'se', x: (frame.x + frame.width) * scale, y: (frame.y + frame.height) * scale },
    { handle: 's', x: (frame.x + frame.width / 2) * scale, y: (frame.y + frame.height) * scale },
    { handle: 'sw', x: frame.x * scale, y: (frame.y + frame.height) * scale },
    { handle: 'w', x: frame.x * scale, y: (frame.y + frame.height / 2) * scale },
  ];

  const handleMouseDown = (e: React.MouseEvent, handle: ResizeHandle | null = null) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
    if (!rect) return;

    const point = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };

    setCurrentHandle(handle);
    setDragState(startDrag(createDragState(), frame.id, frame, point, handle));

    // Add global mouse event listeners
    const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
      const movePoint = {
        x: (moveEvent.clientX - rect.left) / scale,
        y: (moveEvent.clientY - rect.top) / scale,
      };

      if (handle) {
        // Resizing
        const newSize = calculateResize(
          { ...dragState, startPoint: point, frameStartX: frame.x, frameStartY: frame.y, handle },
          frame,
          movePoint
        );
        store.resizeFrame(frame.id, newSize.width, newSize.height);
        if (newSize.x !== frame.x || newSize.y !== frame.y) {
          store.moveFrame(frame.id, newSize.x, newSize.y);
        }
      } else {
        // Moving
        const newPos = calculateDragPosition(
          { ...dragState, startPoint: point, frameStartX: frame.x, frameStartY: frame.y },
          movePoint
        );
        store.moveFrame(frame.id, newPos.x, newPos.y);
      }
    };

    const handleGlobalMouseUp = () => {
      setDragState(createDragState());
      setCurrentHandle(null);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleFrameClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if clicking on a handle
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const point = {
      x: (e.clientX - rect.left) / scale + frame.x,
      y: (e.clientY - rect.top) / scale + frame.y,
    };

    const handle = hitTestHandle(frame, point);
    if (handle) {
      handleMouseDown(e, handle);
    } else {
      handleMouseDown(e, null);
    }
  };

  return (
    <div
      className="fm-frame-selection"
      style={{
        position: 'absolute',
        left: `${frame.x * scale}px`,
        top: `${frame.y * scale}px`,
        width: `${frame.width * scale}px`,
        height: `${frame.height * scale}px`,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Selection border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '2px solid #2563eb',
          pointerEvents: 'all',
          cursor: dragState.isDragging ? 'grabbing' : 'move',
        }}
        onMouseDown={handleFrameClick}
      />

      {/* Resize handles */}
      {handles.map((h) => (
        <div
          key={h.handle}
          style={{
            position: 'absolute',
            left: `${h.x - frame.x * scale - handleSize / 2}px`,
            top: `${h.y - frame.y * scale - handleSize / 2}px`,
            width: `${handleSize}px`,
            height: `${handleSize}px`,
            backgroundColor: 'white',
            border: '1px solid #2563eb',
            cursor: getHandleCursor(h.handle),
            pointerEvents: 'all',
          }}
          onMouseDown={(e) => handleMouseDown(e, h.handle)}
        />
      ))}

      {/* Frame info tooltip */}
      {dragState.isDragging && (
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
          }}
        >
          {currentHandle
            ? `${Math.round(frame.width)}pt × ${Math.round(frame.height)}pt`
            : `${Math.round(frame.x)}pt, ${Math.round(frame.y)}pt`}
        </div>
      )}
    </div>
  );
};
