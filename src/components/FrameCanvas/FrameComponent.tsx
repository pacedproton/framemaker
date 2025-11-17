import React, { useRef, useState, useEffect } from 'react';
import { useFrameStore } from '../../store/frameStore';
import type { Frame } from '../../types/frame';

interface FrameComponentProps {
  frame: Frame;
  isSelected: boolean;
  scale: number;
}

const FrameComponent: React.FC<FrameComponentProps> = ({ frame, isSelected, scale }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(frame.content || '');

  const {
    selectFrame,
    moveFrame,
    resizeFrame,
    updateFrame,
    isDragging,
    isResizing,
    dragOffset,
    resizeHandle,
    setDragging,
    setResizing,
    tool,
  } = useFrameStore();

  useEffect(() => {
    setLocalContent(frame.content || '');
  }, [frame.content]);

  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool !== 'select' || frame.locked) return;
    e.stopPropagation();
    selectFrame(frame.id);

    if (!isEditing) {
      const rect = frameRef.current?.getBoundingClientRect();
      if (rect) {
        const offsetX = e.clientX / scale - frame.x;
        const offsetY = e.clientY / scale - frame.y;
        setDragging(true, { x: offsetX, y: offsetY });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (frame.locked) return;

    e.stopPropagation();
    const parentRect = frameRef.current?.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    const mouseX = (e.clientX - parentRect.left) / scale;
    const mouseY = (e.clientY - parentRect.top) / scale;

    if (isDragging) {
      const newX = mouseX - dragOffset.x;
      const newY = mouseY - dragOffset.y;
      moveFrame(frame.id, newX, newY);
    } else if (isResizing && resizeHandle) {
      handleResize(mouseX, mouseY);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(false);
    setResizing(false, null);
  };

  const handleResize = (mouseX: number, mouseY: number) => {
    let newX = frame.x;
    let newY = frame.y;
    let newWidth = frame.width;
    let newHeight = frame.height;

    switch (resizeHandle) {
      case 'nw':
        newWidth = frame.x + frame.width - mouseX;
        newHeight = frame.y + frame.height - mouseY;
        newX = mouseX;
        newY = mouseY;
        break;
      case 'n':
        newHeight = frame.y + frame.height - mouseY;
        newY = mouseY;
        break;
      case 'ne':
        newWidth = mouseX - frame.x;
        newHeight = frame.y + frame.height - mouseY;
        newY = mouseY;
        break;
      case 'e':
        newWidth = mouseX - frame.x;
        break;
      case 'se':
        newWidth = mouseX - frame.x;
        newHeight = mouseY - frame.y;
        break;
      case 's':
        newHeight = mouseY - frame.y;
        break;
      case 'sw':
        newWidth = frame.x + frame.width - mouseX;
        newHeight = mouseY - frame.y;
        newX = mouseX;
        break;
      case 'w':
        newWidth = frame.x + frame.width - mouseX;
        newX = mouseX;
        break;
    }

    resizeFrame(frame.id, newWidth, newHeight, newX, newY);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (frame.type === 'text' || frame.type === 'unanchored') {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    updateFrame(frame.id, { content: localContent });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLocalContent(frame.content || '');
    }
  };

  const renderResizeHandles = () => {
    if (!isSelected || frame.locked) return null;

    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    return handles.map((handle) => (
      <div
        key={handle}
        className={`resize-handle resize-handle-${handle}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          setResizing(true, handle);
        }}
      />
    ));
  };

  const renderFlowIndicator = () => {
    if (frame.type !== 'text') return null;

    return (
      <>
        {frame.prevFrameId && (
          <div className="flow-indicator flow-in" title="Text flows from another frame">
            ←
          </div>
        )}
        {frame.nextFrameId && (
          <div className="flow-indicator flow-out" title="Text flows to another frame">
            →
          </div>
        )}
        {frame.overflow && !frame.nextFrameId && (
          <div className="overflow-indicator" title="Text overflow - connect to another frame">
            ⚠
          </div>
        )}
      </>
    );
  };

  const frameStyle: React.CSSProperties = {
    left: frame.x,
    top: frame.y,
    width: frame.width,
    height: frame.height,
    transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
    zIndex: frame.zIndex,
    backgroundColor: frame.backgroundColor,
    borderColor: frame.borderColor,
    borderWidth: frame.borderWidth,
    borderStyle: frame.borderStyle,
    opacity: frame.opacity,
  };

  const contentStyle: React.CSSProperties = {
    padding: frame.textInset
      ? `${frame.textInset.top}px ${frame.textInset.right}px ${frame.textInset.bottom}px ${frame.textInset.left}px`
      : '6px',
    columnCount: frame.columns || 1,
    columnGap: frame.columnGap ? `${frame.columnGap}px` : '12px',
  };

  return (
    <div
      ref={frameRef}
      className={`frame frame-${frame.type} ${isSelected ? 'selected' : ''} ${frame.locked ? 'locked' : ''}`}
      style={frameStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <div className="frame-label">
        {frame.name} {frame.locked && '🔒'}
      </div>

      <div className="frame-content" style={contentStyle}>
        {frame.type === 'graphic' && frame.imageUrl ? (
          <img
            src={frame.imageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: frame.imageFit === 'fit' ? 'contain' : frame.imageFit === 'fill' ? 'cover' : frame.imageFit === 'stretch' ? 'fill' : 'contain',
            }}
          />
        ) : frame.type === 'graphic' ? (
          <div className="graphic-placeholder">
            <span>Graphic Frame</span>
            <small>Double-click to add image</small>
          </div>
        ) : isEditing ? (
          <textarea
            ref={textAreaRef}
            className="frame-text-editor"
            value={localContent}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            placeholder="Type here..."
          />
        ) : (
          <div className="frame-text-display">
            {localContent || (
              <span className="placeholder">Double-click to edit text</span>
            )}
          </div>
        )}
      </div>

      {renderFlowIndicator()}
      {renderResizeHandles()}
    </div>
  );
};

export default FrameComponent;
