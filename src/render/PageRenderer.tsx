// Page Renderer - renders a single page with all its frames
import React from 'react';
import type { Page, Frame, TextFrame, ImageFrame } from '../document/types';
import { useStore, store } from '../document/store';
import { TextFrameRenderer } from './TextFrameRenderer';
import { ImageFrameRenderer } from './ImageFrameRenderer';
import { FrameSelectionOverlay } from './FrameSelectionOverlay';

interface PageRendererProps {
  page: Page;
  scale: number;
}

export const PageRenderer: React.FC<PageRendererProps> = ({ page, scale }) => {
  const state = useStore();
  const { showGrid, showMargins } = state;
  const { pageSize, margins } = state.document;

  const pageStyle: React.CSSProperties = {
    position: 'relative',
    width: `${pageSize.width}px`,
    height: `${pageSize.height}px`,
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    margin: '0 auto',
  };

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridSize = state.document.settings.gridSpacing;
    const lines: React.ReactElement[] = [];

    // Vertical lines
    for (let x = 0; x <= pageSize.width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={pageSize.height}
          stroke="#e0e0e0"
          strokeWidth="0.5"
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= pageSize.height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={pageSize.width}
          y2={y}
          stroke="#e0e0e0"
          strokeWidth="0.5"
        />
      );
    }

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {lines}
      </svg>
    );
  };

  // Render margin guides
  const renderMargins = () => {
    if (!showMargins) return null;

    const marginRect = {
      x: margins.left,
      y: margins.top,
      width: pageSize.width - margins.left - margins.right,
      height: pageSize.height - margins.top - margins.bottom,
    };

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <rect
          x={marginRect.x}
          y={marginRect.y}
          width={marginRect.width}
          height={marginRect.height}
          fill="none"
          stroke="#00bfff"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>
    );
  };

  // Render frames
  const renderFrame = (frame: Frame) => {
    switch (frame.type) {
      case 'text':
        return <TextFrameRenderer key={frame.id} frame={frame as TextFrame} scale={scale} />;
      case 'anchored':
        // TODO: Implement anchored frame renderer
        return (
          <div
            key={frame.id}
            style={{
              position: 'absolute',
              left: frame.x,
              top: frame.y,
              width: frame.width,
              height: frame.height,
              border: '1px dashed #f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
            }}
          >
            <span style={{ fontSize: 10, color: '#f59e0b' }}>Anchored Frame</span>
          </div>
        );
      case 'unanchored':
        // TODO: Implement unanchored frame renderer
        return (
          <div
            key={frame.id}
            style={{
              position: 'absolute',
              left: frame.x,
              top: frame.y,
              width: frame.width,
              height: frame.height,
              border: '1px solid #10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
            }}
          >
            <span style={{ fontSize: 10, color: '#10b981' }}>Graphic Frame</span>
          </div>
        );
      case 'image':
        return <ImageFrameRenderer key={frame.id} frame={frame as ImageFrame} scale={scale} />;
      default:
        return null;
    }
  };

  // Sort frames by z-index
  const sortedFrames = [...page.frames].sort((a, b) => a.zIndex - b.zIndex);

  // Handle click on page background to deselect
  const handlePageClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      store.selectFrame(null);
      store.stopTextEditing();
    }
  };

  return (
    <div className="fm-page" style={pageStyle} onClick={handlePageClick}>
      {renderGrid()}
      {renderMargins()}

      {sortedFrames.map(renderFrame)}

      {/* Selection overlays */}
      {sortedFrames.map((frame) => (
        <FrameSelectionOverlay key={`selection-${frame.id}`} frame={frame} scale={scale} />
      ))}
    </div>
  );
};
