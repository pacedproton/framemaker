// Text Frame Renderer - renders text frame with inline editing
import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { TextFrame, Paragraph, CharacterProperties } from '../document/types';
import { store, useStore } from '../document/store';
import { defaultParagraphProperties } from '../document/types';
import { parseSimpleEquation } from '../engine/EquationEditor';
import { EquationRenderer } from './EquationRenderer';
import { TableRenderer } from './TableRenderer';
import type { Table } from '../engine/TableEngine';

interface TextFrameRendererProps {
  frame: TextFrame;
  scale: number;
}

export const TextFrameRenderer: React.FC<TextFrameRendererProps> = ({ frame, scale }) => {
  const state = useStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const isEditing = state.editingFrameId === frame.id;
  const isSelected = state.selectedFrameIds.includes(frame.id);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, frameX: 0, frameY: 0, frameW: 0, frameH: 0 });

  // Get paragraph format from catalog
  const getParagraphFormat = useCallback(
    (tag: string) => {
      const format = state.document.catalog.paragraphFormats.find((f) => f.tag === tag);
      return format ? format.properties : defaultParagraphProperties;
    },
    [state.document.catalog.paragraphFormats]
  );

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.activeTool === 'select' && !isEditing) {
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

  // Handle click to start editing or select frame
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (state.activeTool === 'select') {
      // In select mode, just select (already handled by mousedown)
      store.selectFrame(frame.id);
    } else if (state.activeTool === 'text') {
      // In text mode, start editing
      if (!isEditing) {
        store.startTextEditing(frame.id);
      }
    }
  };

  // Handle double-click to start editing when selected
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      store.startTextEditing(frame.id);
    }
  };

  // Handle keyboard input
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        store.stopTextEditing();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        store.insertParagraph();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        store.deleteBackward();
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        // Implement delete forward
        return;
      }

      // Regular text input
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        store.insertText(e.key);
      }

      // Shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        store.toggleBold();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        store.toggleItalic();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]);

  // Render paragraph with styling
  const renderParagraph = (para: Paragraph, index: number) => {
    const format = getParagraphFormat(para.formatTag);
    const props = para.overrides ? { ...format, ...para.overrides } : format;

    const paraStyle: React.CSSProperties = {
      marginTop: index === 0 ? 0 : `${props.spaceAbove}pt`,
      marginBottom: `${props.spaceBelow}pt`,
      textIndent: `${props.firstIndent}pt`,
      paddingLeft: `${props.leftIndent}pt`,
      paddingRight: `${props.rightIndent}pt`,
      lineHeight: props.lineSpacing,
      textAlign: props.alignment === 'justified' ? 'justify' : props.alignment,
      fontFamily: props.defaultFont.family,
      fontSize: `${props.defaultFont.size}pt`,
      color: props.defaultFont.color,
      fontWeight: props.defaultFont.weight,
      fontStyle: props.defaultFont.style,
      minHeight: `${props.defaultFont.size * props.lineSpacing}pt`,
      position: 'relative',
    };

    const isCursorInParagraph = state.cursor?.paragraphId === para.id;

    return (
      <div
        key={para.id}
        className="fm-paragraph"
        style={paraStyle}
        data-para-id={para.id}
      >
        {renderParagraphContent(para, props.defaultFont)}
        {isEditing && isCursorInParagraph && renderCursor(para)}
      </div>
    );
  };

  // Render paragraph content (text runs)
  const renderParagraphContent = (para: Paragraph, _defaultFont: CharacterProperties) => {
    if (para.content.length === 0) {
      // Empty paragraph placeholder
      return <span className="fm-empty-para">&nbsp;</span>;
    }

    return para.content.map((elem) => {
      if ('text' in elem) {
        const run = elem;
        const runStyle: React.CSSProperties = {};

        // Apply character format if specified
        if (run.characterTag) {
          const charFormat = state.document.catalog.characterFormats.find(
            (f) => f.tag === run.characterTag
          );
          if (charFormat) {
            if (charFormat.properties.family) runStyle.fontFamily = charFormat.properties.family;
            if (charFormat.properties.size) runStyle.fontSize = `${charFormat.properties.size}pt`;
            if (charFormat.properties.weight) runStyle.fontWeight = charFormat.properties.weight;
            if (charFormat.properties.style) runStyle.fontStyle = charFormat.properties.style;
            if (charFormat.properties.color) runStyle.color = charFormat.properties.color;
            if (charFormat.properties.underline) runStyle.textDecoration = 'underline';
            if (charFormat.properties.strikethrough) runStyle.textDecoration = 'line-through';
          }
        }

        // Apply overrides
        if (run.overrides) {
          if (run.overrides.family) runStyle.fontFamily = run.overrides.family;
          if (run.overrides.size) runStyle.fontSize = `${run.overrides.size}pt`;
          if (run.overrides.weight) runStyle.fontWeight = run.overrides.weight;
          if (run.overrides.style) runStyle.fontStyle = run.overrides.style;
          if (run.overrides.color) runStyle.color = run.overrides.color;
          if (run.overrides.underline) runStyle.textDecoration = 'underline';
          if (run.overrides.strikethrough) runStyle.textDecoration = 'line-through';
          if (run.overrides.superscript) {
            runStyle.verticalAlign = 'super';
            runStyle.fontSize = '0.8em';
          }
          if (run.overrides.subscript) {
            runStyle.verticalAlign = 'sub';
            runStyle.fontSize = '0.8em';
          }
        }

        return (
          <span key={run.id} className="fm-text-run" style={runStyle} data-run-id={run.id}>
            {run.text || '\u200B'}
          </span>
        );
      }

      // Render equation inline
      if ('type' in elem && elem.type === 'equation') {
        try {
          const ast = parseSimpleEquation(elem.latex);
          return (
            <span
              key={elem.id}
              className="fm-equation-inline"
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                padding: '0 2px',
                background: 'rgba(37, 99, 235, 0.05)',
                borderRadius: '2px',
              }}
            >
              <EquationRenderer equation={ast} fontSize={elem.fontSize} />
            </span>
          );
        } catch {
          return (
            <span
              key={elem.id}
              className="fm-equation-error"
              style={{ color: '#ef4444', fontStyle: 'italic' }}
            >
              [Invalid Equation]
            </span>
          );
        }
      }

      // Render table inline
      if ('type' in elem && elem.type === 'table') {
        try {
          const tableData = JSON.parse(elem.tableData) as Table;
          return (
            <div
              key={elem.id}
              className="fm-table-inline"
              style={{
                display: 'block',
                margin: '8px 0',
              }}
            >
              <TableRenderer table={tableData} />
            </div>
          );
        } catch {
          return (
            <span
              key={elem.id}
              className="fm-table-error"
              style={{ color: '#ef4444', fontStyle: 'italic' }}
            >
              [Invalid Table]
            </span>
          );
        }
      }

      return null;
    });
  };

  // Render cursor
  const renderCursor = (para: Paragraph) => {
    if (!state.cursor || state.cursor.paragraphId !== para.id) return null;

    // Calculate cursor position using a hidden measurement span
    const offset = state.cursor.offset;
    let textBeforeCursor = '';
    let currentOffset = 0;

    for (const elem of para.content) {
      if ('text' in elem) {
        const remaining = offset - currentOffset;
        if (remaining <= elem.text.length) {
          textBeforeCursor += elem.text.slice(0, remaining);
          break;
        }
        textBeforeCursor += elem.text;
        currentOffset += elem.text.length;
      }
    }

    return (
      <span
        className="fm-cursor"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '1px',
          height: '1em',
          backgroundColor: '#000',
          animation: 'blink 1s step-end infinite',
          pointerEvents: 'none',
        }}
        data-offset={offset}
      >
        <span style={{ visibility: 'hidden', whiteSpace: 'pre' }}>{textBeforeCursor}</span>
      </span>
    );
  };

  const frameStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${frame.x}px`,
    top: `${frame.y}px`,
    width: `${frame.width}px`,
    height: `${frame.height}px`,
    transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    border: state.showFrameBorders
      ? `${frame.strokeWidth}px solid ${frame.strokeColor}`
      : isSelected
        ? '2px solid #0066ff'
        : '1px solid #cccccc',
    backgroundColor: frame.fillColor === 'transparent' ? undefined : frame.fillColor,
    overflow: 'hidden',
    cursor: isEditing ? 'text' : state.activeTool === 'select' ? 'move' : 'default',
    outline: isEditing ? '2px solid #2563eb' : 'none',
    boxShadow: isSelected ? '0 0 0 1px #0066ff' : 'none',
  };

  const contentStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    padding: '6px',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '12pt',
    lineHeight: 1.5,
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  };

  return (
    <div
      className={`fm-text-frame ${isEditing ? 'editing' : ''} ${isSelected ? 'selected' : ''}`}
      style={frameStyle}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div ref={contentRef} className="fm-text-content" style={contentStyle}>
        {frame.paragraphs.map((para, i) => renderParagraph(para, i))}
      </div>

      {frame.overflow && (
        <div
          className="fm-overflow-indicator"
          style={{
            position: 'absolute',
            right: 2,
            bottom: 2,
            width: 12,
            height: 12,
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
          }}
        >
          +
        </div>
      )}

      {/* Flow connection indicators */}
      {isSelected && frame.prevFrameId && (
        <div
          className="fm-flow-in-indicator"
          style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 16,
            height: 16,
            backgroundColor: '#2563eb',
            color: 'white',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
          title="Flows from previous frame"
        >
          ↓
        </div>
      )}

      {isSelected && frame.nextFrameId && (
        <div
          className="fm-flow-out-indicator"
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 16,
            height: 16,
            backgroundColor: '#2563eb',
            color: 'white',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
          title="Flows to next frame"
        >
          ↓
        </div>
      )}

      {/* Resize handles - only show when selected and not editing */}
      {isSelected && !isEditing && (
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
          {/* Edge handles */}
          <div
            className="resize-handle n"
            style={{
              position: 'absolute',
              top: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 8,
              height: 8,
              background: 'white',
              border: '1px solid #0066ff',
              cursor: 'ns-resize',
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
          />
          <div
            className="resize-handle s"
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 8,
              height: 8,
              background: 'white',
              border: '1px solid #0066ff',
              cursor: 'ns-resize',
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
          />
          <div
            className="resize-handle w"
            style={{
              position: 'absolute',
              top: '50%',
              left: -4,
              transform: 'translateY(-50%)',
              width: 8,
              height: 8,
              background: 'white',
              border: '1px solid #0066ff',
              cursor: 'ew-resize',
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
          />
          <div
            className="resize-handle e"
            style={{
              position: 'absolute',
              top: '50%',
              right: -4,
              transform: 'translateY(-50%)',
              width: 8,
              height: 8,
              background: 'white',
              border: '1px solid #0066ff',
              cursor: 'ew-resize',
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
          />
        </>
      )}
    </div>
  );
};
