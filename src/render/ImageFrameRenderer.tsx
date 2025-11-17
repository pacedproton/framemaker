// Image Frame Renderer - renders image frames
import React, { useState } from 'react';
import type { ImageFrame } from '../document/types';
import { store, useStore } from '../document/store';

interface ImageFrameRendererProps {
  frame: ImageFrame;
  scale: number;
}

export const ImageFrameRenderer: React.FC<ImageFrameRendererProps> = ({ frame, scale }) => {
  const state = useStore();
  const isSelected = state.selectedFrameIds.includes(frame.id);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragStart = React.useRef({ x: 0, y: 0, frameX: 0, frameY: 0, frameW: 0, frameH: 0 });

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.activeTool === 'select') {
      e.preventDefault();
      e.stopPropagation();
      store.selectFrame(frame.id);
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

  // Handle mouse move for dragging/resizing
  React.useEffect(() => {
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

        newW = Math.max(50, newW);
        newH = Math.max(50, newH);

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

  const frameStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${frame.x}px`,
    top: `${frame.y}px`,
    width: `${frame.width}px`,
    height: `${frame.height}px`,
    transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    border: isSelected ? '2px solid #0066ff' : `${frame.strokeWidth}px solid ${frame.strokeColor}`,
    backgroundColor: frame.fillColor === 'transparent' ? undefined : frame.fillColor,
    overflow: 'hidden',
    cursor: state.activeTool === 'select' ? 'move' : 'default',
    boxShadow: isSelected ? '0 0 0 1px #0066ff' : 'none',
  };

  return (
    <div
      className={`fm-image-frame ${isSelected ? 'selected' : ''}`}
      style={frameStyle}
      onMouseDown={handleMouseDown}
    >
      {frame.imageUrl ? (
        <img
          src={frame.imageUrl}
          alt={frame.altText}
          style={{
            width: '100%',
            height: '100%',
            objectFit: frame.objectFit,
            opacity: frame.opacity,
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#808080',
            fontSize: '12px',
          }}
        >
          No Image
        </div>
      )}

      {/* Resize handles */}
      {isSelected && (
        <>
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
