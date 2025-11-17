// Text Frame Renderer - renders text frame with inline editing
import React, { useRef, useEffect, useCallback } from 'react';
import type { TextFrame, Paragraph, CharacterProperties } from '../document/types';
import { store, useStore } from '../document/store';
import { defaultParagraphProperties } from '../document/types';

interface TextFrameRendererProps {
  frame: TextFrame;
  scale: number;
}

export const TextFrameRenderer: React.FC<TextFrameRendererProps> = ({ frame, scale }) => {
  const state = useStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const isEditing = state.editingFrameId === frame.id;

  // Get paragraph format from catalog
  const getParagraphFormat = useCallback(
    (tag: string) => {
      const format = state.document.catalog.paragraphFormats.find((f) => f.tag === tag);
      return format ? format.properties : defaultParagraphProperties;
    },
    [state.document.catalog.paragraphFormats]
  );

  // Handle click to start editing or select frame
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (state.activeTool === 'select') {
      // In select mode, select the frame
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
    left: `${frame.x * scale}px`,
    top: `${frame.y * scale}px`,
    width: `${frame.width * scale}px`,
    height: `${frame.height * scale}px`,
    transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    border: state.showFrameBorders ? `${frame.strokeWidth}px solid ${frame.strokeColor}` : 'none',
    backgroundColor: frame.fillColor === 'transparent' ? undefined : frame.fillColor,
    overflow: 'hidden',
    cursor: isEditing ? 'text' : 'default',
    outline: isEditing ? '2px solid #2563eb' : 'none',
  };

  const contentStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    padding: '6px',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: `${12 * scale}pt`,
    lineHeight: 1.5,
  };

  return (
    <div
      className={`fm-text-frame ${isEditing ? 'editing' : ''}`}
      style={frameStyle}
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
    </div>
  );
};
