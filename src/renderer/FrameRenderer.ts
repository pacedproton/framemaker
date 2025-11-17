// Canvas-based Frame Renderer
// Renders frames directly onto an HTML5 canvas

import type {
  Page,
  Frame,
  TextFrame,
  MathFrame,
  GraphicFrame,
  TableFrame,
} from '../core/types';
import { store } from '../core/store';

export class FrameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number = 1;

  // Image cache
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  render(page: Page, showGrid: boolean, showMargins: boolean, showFrameBorders: boolean): void {
    const ctx = this.ctx;
    const width = page.width * this.scale;
    const height = page.height * this.scale;

    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Scale for rendering
    ctx.save();
    ctx.scale(this.scale, this.scale);

    // Render grid
    if (showGrid) {
      this.renderGrid(page);
    }

    // Render margins
    if (showMargins) {
      this.renderMargins(page);
    }

    // Sort frames by z-index and render
    const sortedFrames = [...page.frames].sort((a, b) => a.zIndex - b.zIndex);

    for (const frame of sortedFrames) {
      if (!frame.visible) continue;

      ctx.save();

      // Apply rotation if needed
      if (frame.rotation !== 0) {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((frame.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      // Render frame based on type
      switch (frame.type) {
        case 'text':
          this.renderTextFrame(frame as TextFrame, showFrameBorders);
          break;
        case 'math':
          this.renderMathFrame(frame as MathFrame, showFrameBorders);
          break;
        case 'graphic':
          this.renderGraphicFrame(frame as GraphicFrame, showFrameBorders);
          break;
        case 'table':
          this.renderTableFrame(frame as TableFrame, showFrameBorders);
          break;
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private renderGrid(page: Page): void {
    const ctx = this.ctx;
    const gridSize = store.getState().gridSize;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= page.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, page.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= page.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(page.width, y);
      ctx.stroke();
    }
  }

  private renderMargins(page: Page): void {
    const ctx = this.ctx;
    const { top, right, bottom, left } = page.margins;

    ctx.strokeStyle = '#90cdf4';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.strokeRect(left, top, page.width - left - right, page.height - top - bottom);

    ctx.setLineDash([]);
  }

  private renderTextFrame(frame: TextFrame, showBorder: boolean): void {
    const ctx = this.ctx;

    // Background
    if (frame.backgroundColor !== 'transparent') {
      ctx.globalAlpha = frame.opacity;
      ctx.fillStyle = frame.backgroundColor;
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
      ctx.globalAlpha = 1;
    }

    // Border
    if (showBorder || frame.borderWidth > 0) {
      ctx.strokeStyle = showBorder ? '#2563eb' : frame.borderColor;
      ctx.lineWidth = showBorder ? 1 : frame.borderWidth;
      ctx.setLineDash(showBorder ? [2, 2] : []);
      ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
      ctx.setLineDash([]);
    }

    // Text content
    if (frame.content.length > 0) {
      this.renderTextContent(frame);
    } else {
      // Placeholder text
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Text Frame', frame.x + frame.width / 2, frame.y + frame.height / 2);
    }

    // Text flow indicators
    if (frame.prevFrameId) {
      this.renderFlowIndicator(frame, 'in');
    }
    if (frame.nextFrameId) {
      this.renderFlowIndicator(frame, 'out');
    }

    // Overflow indicator
    if (frame.hasOverflow) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(frame.x + frame.width - 12, frame.y + frame.height - 12, 10, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', frame.x + frame.width - 7, frame.y + frame.height - 7);
    }
  }

  private renderTextContent(frame: TextFrame): void {
    const ctx = this.ctx;
    const { margins, columns, columnGap } = frame;
    const contentWidth = frame.width - margins.left - margins.right;
    const columnWidth = (contentWidth - columnGap * (columns - 1)) / columns;

    let x = frame.x + margins.left;
    let y = frame.y + margins.top;
    let currentColumn = 0;

    for (const run of frame.content) {
      const { text, style } = run;

      // Set font
      const fontStyle = style.fontStyle === 'italic' ? 'italic ' : '';
      const fontWeight = style.fontWeight === 'bold' ? 'bold ' : '';
      ctx.font = `${fontStyle}${fontWeight}${style.fontSize}pt ${style.fontFamily}`;
      ctx.fillStyle = style.color;
      ctx.textBaseline = 'top';

      // Word wrap
      const words = text.split(' ');
      let line = '';

      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > columnWidth && line) {
          // Draw current line
          ctx.fillText(line, x, y);
          line = word;
          y += style.fontSize * 1.5;

          // Check if we need to move to next column
          if (y + style.fontSize > frame.y + frame.height - margins.bottom) {
            currentColumn++;
            if (currentColumn < columns) {
              x = frame.x + margins.left + (columnWidth + columnGap) * currentColumn;
              y = frame.y + margins.top;
            } else {
              // Overflow
              frame.hasOverflow = true;
              return;
            }
          }
        } else {
          line = testLine;
        }
      }

      // Draw remaining text
      if (line) {
        ctx.fillText(line, x, y);
        y += style.fontSize * 1.5;
      }
    }
  }

  private renderFlowIndicator(frame: TextFrame, direction: 'in' | 'out'): void {
    const ctx = this.ctx;
    const size = 12;
    let x: number, y: number;

    if (direction === 'in') {
      x = frame.x;
      y = frame.y + frame.height / 2 - size / 2;
    } else {
      x = frame.x + frame.width - size;
      y = frame.y + frame.height / 2 - size / 2;
    }

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    if (direction === 'in') {
      ctx.moveTo(x, y + size / 2);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size, y + size);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y + size / 2);
      ctx.lineTo(x, y + size);
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderMathFrame(frame: MathFrame, showBorder: boolean): void {
    const ctx = this.ctx;

    // Background
    if (frame.backgroundColor !== 'transparent') {
      ctx.globalAlpha = frame.opacity;
      ctx.fillStyle = frame.backgroundColor;
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
      ctx.globalAlpha = 1;
    }

    // Border
    if (showBorder || frame.borderWidth > 0) {
      ctx.strokeStyle = showBorder ? '#7c3aed' : frame.borderColor;
      ctx.lineWidth = showBorder ? 1 : frame.borderWidth;
      ctx.setLineDash(showBorder ? [2, 2] : []);
      ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
      ctx.setLineDash([]);
    }

    // Math content (simplified - would use KaTeX in real implementation)
    if (frame.latex) {
      ctx.fillStyle = frame.color;
      ctx.font = `${frame.fontSize}pt serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Simple LaTeX rendering (placeholder)
      let displayText = frame.latex;
      // Convert some basic LaTeX to display
      displayText = displayText.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
      displayText = displayText.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
      displayText = displayText.replace(/\\pi/g, 'π');
      displayText = displayText.replace(/\\alpha/g, 'α');
      displayText = displayText.replace(/\\beta/g, 'β');
      displayText = displayText.replace(/\\gamma/g, 'γ');
      displayText = displayText.replace(/\\sum/g, 'Σ');
      displayText = displayText.replace(/\\int/g, '∫');
      displayText = displayText.replace(/\\infty/g, '∞');
      displayText = displayText.replace(/\^(\{[^}]+\}|\S)/g, '^$1');
      displayText = displayText.replace(/_(\{[^}]+\}|\S)/g, '₍$1₎');

      ctx.fillText(displayText, frame.x + frame.width / 2, frame.y + frame.height / 2);
    } else {
      // Placeholder
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Math Frame', frame.x + frame.width / 2, frame.y + frame.height / 2);
      ctx.font = '10px sans-serif';
      ctx.fillText('(Double-click to edit)', frame.x + frame.width / 2, frame.y + frame.height / 2 + 16);
    }

    // Math indicator
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('∑', frame.x + 4, frame.y + 4);
  }

  private renderGraphicFrame(frame: GraphicFrame, showBorder: boolean): void {
    const ctx = this.ctx;

    // Background
    ctx.globalAlpha = frame.opacity;
    ctx.fillStyle = frame.backgroundColor;
    ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
    ctx.globalAlpha = 1;

    // Image
    if (frame.imageUrl || frame.imageData) {
      const src = frame.imageUrl || frame.imageData!;
      let img = this.imageCache.get(src);

      if (!img) {
        img = new Image();
        img.src = src;
        this.imageCache.set(src, img);
        img.onload = () => {
          // Trigger re-render when image loads
          const state = store.getState();
          const page = state.document.pages[state.currentPageIndex];
          this.render(page, state.showGrid, state.showMargins, state.showFrameBorders);
        };
      }

      if (img.complete && img.naturalWidth > 0) {
        this.drawImage(ctx, img, frame);
      }
    } else {
      // Placeholder
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Graphic Frame', frame.x + frame.width / 2, frame.y + frame.height / 2);

      // Diagonal lines (placeholder graphic)
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(frame.x, frame.y);
      ctx.lineTo(frame.x + frame.width, frame.y + frame.height);
      ctx.moveTo(frame.x + frame.width, frame.y);
      ctx.lineTo(frame.x, frame.y + frame.height);
      ctx.stroke();
    }

    // Border
    if (showBorder || frame.borderWidth > 0) {
      ctx.strokeStyle = showBorder ? '#10b981' : frame.borderColor;
      ctx.lineWidth = showBorder ? 1 : frame.borderWidth;
      ctx.setLineDash(showBorder ? [2, 2] : []);
      ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
      ctx.setLineDash([]);
    }
  }

  private drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, frame: GraphicFrame): void {
    const { x, y, width, height, fitMode, imagePosition, imageScale } = frame;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    switch (fitMode) {
      case 'fill': {
        // Cover entire frame, may crop
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const sw = img.naturalWidth * scale;
        const sh = img.naturalHeight * scale;
        const sx = x + (width - sw) / 2 + imagePosition.x;
        const sy = y + (height - sh) / 2 + imagePosition.y;
        ctx.drawImage(img, sx, sy, sw, sh);
        break;
      }
      case 'fit': {
        // Fit within frame, may have borders
        const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
        const sw = img.naturalWidth * scale;
        const sh = img.naturalHeight * scale;
        const sx = x + (width - sw) / 2 + imagePosition.x;
        const sy = y + (height - sh) / 2 + imagePosition.y;
        ctx.drawImage(img, sx, sy, sw, sh);
        break;
      }
      case 'stretch':
        ctx.drawImage(img, x + imagePosition.x, y + imagePosition.y, width, height);
        break;
      case 'tile': {
        const tw = img.naturalWidth * imageScale;
        const th = img.naturalHeight * imageScale;
        for (let ty = y; ty < y + height; ty += th) {
          for (let tx = x; tx < x + width; tx += tw) {
            ctx.drawImage(img, tx + imagePosition.x, ty + imagePosition.y, tw, th);
          }
        }
        break;
      }
      case 'none':
      default: {
        const sw = img.naturalWidth * imageScale;
        const sh = img.naturalHeight * imageScale;
        ctx.drawImage(img, x + imagePosition.x, y + imagePosition.y, sw, sh);
        break;
      }
    }

    ctx.restore();
  }

  private renderTableFrame(frame: TableFrame, showBorder: boolean): void {
    const ctx = this.ctx;

    // Background
    ctx.globalAlpha = frame.opacity;
    ctx.fillStyle = frame.backgroundColor;
    ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
    ctx.globalAlpha = 1;

    // Border
    if (showBorder || frame.borderWidth > 0) {
      ctx.strokeStyle = showBorder ? '#f59e0b' : frame.borderColor;
      ctx.lineWidth = showBorder ? 1 : frame.borderWidth;
      ctx.setLineDash(showBorder ? [2, 2] : []);
      ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
      ctx.setLineDash([]);
    }

    // Table content
    const { margins, cells, columnWidths, rowHeights, cellPadding, headerRows } = frame;
    const tableX = frame.x + margins.left;
    const tableY = frame.y + margins.top;

    let currentY = tableY;
    for (let r = 0; r < frame.rows; r++) {
      let currentX = tableX;
      for (let c = 0; c < frame.cols; c++) {
        const cell = cells[r][c];
        const cellWidth = columnWidths[c];
        const cellHeight = rowHeights[r];

        // Cell background
        if (r < headerRows) {
          ctx.fillStyle = '#e5e7eb';
        } else {
          ctx.fillStyle = cell.backgroundColor;
        }
        ctx.fillRect(currentX, currentY, cellWidth, cellHeight);

        // Cell border
        ctx.strokeStyle = cell.borderTop.color;
        ctx.lineWidth = cell.borderTop.width;
        ctx.strokeRect(currentX, currentY, cellWidth, cellHeight);

        // Cell content
        if (cell.content.length > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(currentX + cellPadding, currentY + cellPadding, cellWidth - cellPadding * 2, cellHeight - cellPadding * 2);
          ctx.clip();

          let textY = currentY + cellPadding;
          for (const run of cell.content) {
            const { text, style } = run;
            const fontStyle = style.fontStyle === 'italic' ? 'italic ' : '';
            const fontWeight = style.fontWeight === 'bold' ? 'bold ' : '';
            ctx.font = `${fontStyle}${fontWeight}${style.fontSize}pt ${style.fontFamily}`;
            ctx.fillStyle = style.color;
            ctx.textBaseline = 'top';
            ctx.fillText(text, currentX + cellPadding, textY);
            textY += style.fontSize * 1.2;
          }

          ctx.restore();
        }

        currentX += cellWidth;
      }
      currentY += rowHeights[r];
    }

    // Table indicator
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('⊞', frame.x + 4, frame.y + 4);
  }

  // Selection rendering
  renderSelection(frame: Frame): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.scale(this.scale, this.scale);

    // Apply rotation
    if (frame.rotation !== 0) {
      const cx = frame.x + frame.width / 2;
      const cy = frame.y + frame.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((frame.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    // Selection border
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);

    // Resize handles
    const handleSize = 8;
    const handles = [
      { x: frame.x - handleSize / 2, y: frame.y - handleSize / 2 }, // NW
      { x: frame.x + frame.width / 2 - handleSize / 2, y: frame.y - handleSize / 2 }, // N
      { x: frame.x + frame.width - handleSize / 2, y: frame.y - handleSize / 2 }, // NE
      { x: frame.x + frame.width - handleSize / 2, y: frame.y + frame.height / 2 - handleSize / 2 }, // E
      { x: frame.x + frame.width - handleSize / 2, y: frame.y + frame.height - handleSize / 2 }, // SE
      { x: frame.x + frame.width / 2 - handleSize / 2, y: frame.y + frame.height - handleSize / 2 }, // S
      { x: frame.x - handleSize / 2, y: frame.y + frame.height - handleSize / 2 }, // SW
      { x: frame.x - handleSize / 2, y: frame.y + frame.height / 2 - handleSize / 2 }, // W
    ];

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1;

    for (const handle of handles) {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    }

    // Rotation handle
    const rotationHandleY = frame.y - 30;
    ctx.beginPath();
    ctx.moveTo(frame.x + frame.width / 2, frame.y);
    ctx.lineTo(frame.x + frame.width / 2, rotationHandleY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(frame.x + frame.width / 2, rotationHandleY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
