// PDF Export using Canvas
// Renders frames to PDF format

import type { Page, TextFrame, MathFrame, GraphicFrame, TableFrame } from './types';

export class PDFExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  async exportToPDF(pages: Page[], filename: string = 'document.pdf'): Promise<void> {
    // Since we don't have jsPDF, we'll export as a high-resolution image
    // that can be printed to PDF
    const pagesData: string[] = [];

    for (const page of pages) {
      const imageData = await this.renderPageToImage(page);
      pagesData.push(imageData);
    }

    // Create a simple HTML document for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            @page {
              size: ${pages[0].width / 72}in ${pages[0].height / 72}in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .page {
              page-break-after: always;
              width: ${pages[0].width / 72}in;
              height: ${pages[0].height / 72}in;
            }
            .page:last-child {
              page-break-after: avoid;
            }
            img {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          ${pagesData.map((data) => `<div class="page"><img src="${data}" /></div>`).join('')}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Give it time to load images, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  private async renderPageToImage(page: Page): Promise<string> {
    // High resolution for printing (300 DPI)
    const scale = 300 / 72; // Convert 72 DPI points to 300 DPI
    const width = page.width * scale;
    const height = page.height * scale;

    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(scale, scale);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, page.width, page.height);

    // Render all frames
    const sortedFrames = [...page.frames].sort((a, b) => a.zIndex - b.zIndex);

    for (const frame of sortedFrames) {
      if (!frame.visible) continue;

      ctx.save();

      // Apply rotation
      if (frame.rotation !== 0) {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((frame.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      switch (frame.type) {
        case 'text':
          this.renderTextFramePDF(frame as TextFrame);
          break;
        case 'math':
          this.renderMathFramePDF(frame as MathFrame);
          break;
        case 'graphic':
          this.renderGraphicFramePDF(frame as GraphicFrame);
          break;
        case 'table':
          this.renderTableFramePDF(frame as TableFrame);
          break;
      }

      ctx.restore();
    }

    ctx.restore();

    return this.canvas.toDataURL('image/png');
  }

  private renderTextFramePDF(frame: TextFrame): void {
    const ctx = this.ctx;

    // Background
    if (frame.backgroundColor !== '#ffffff' && frame.backgroundColor !== 'transparent') {
      ctx.fillStyle = frame.backgroundColor;
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
    }

    // Border (only if visible)
    if (frame.borderWidth > 0) {
      ctx.strokeStyle = frame.borderColor;
      ctx.lineWidth = frame.borderWidth;
      ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
    }

    // Text content
    if (frame.content.length > 0) {
      const { margins, columns, columnGap } = frame;
      const contentWidth = frame.width - margins.left - margins.right;
      const columnWidth = (contentWidth - columnGap * (columns - 1)) / columns;

      let x = frame.x + margins.left;
      let y = frame.y + margins.top;
      let currentColumn = 0;

      for (const run of frame.content) {
        const { text, style } = run;

        const fontStyle = style.fontStyle === 'italic' ? 'italic ' : '';
        const fontWeight = style.fontWeight === 'bold' ? 'bold ' : '';
        ctx.font = `${fontStyle}${fontWeight}${style.fontSize}pt ${style.fontFamily}`;
        ctx.fillStyle = style.color;
        ctx.textBaseline = 'top';

        const words = text.split(' ');
        let line = '';

        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width > columnWidth && line) {
            ctx.fillText(line, x, y);
            line = word;
            y += style.fontSize * 1.5;

            if (y + style.fontSize > frame.y + frame.height - margins.bottom) {
              currentColumn++;
              if (currentColumn < columns) {
                x = frame.x + margins.left + (columnWidth + columnGap) * currentColumn;
                y = frame.y + margins.top;
              } else {
                return;
              }
            }
          } else {
            line = testLine;
          }
        }

        if (line) {
          ctx.fillText(line, x, y);
          y += style.fontSize * 1.5;
        }
      }
    }
  }

  private renderMathFramePDF(frame: MathFrame): void {
    const ctx = this.ctx;

    // Background
    if (frame.backgroundColor !== '#ffffff' && frame.backgroundColor !== 'transparent') {
      ctx.fillStyle = frame.backgroundColor;
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
    }

    // Render math
    if (frame.latex) {
      ctx.fillStyle = frame.color;
      ctx.font = `${frame.fontSize}pt serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Simple LaTeX rendering
      let displayText = frame.latex;
      displayText = displayText.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
      displayText = displayText.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
      displayText = displayText.replace(/\\pi/g, 'π');
      displayText = displayText.replace(/\\alpha/g, 'α');
      displayText = displayText.replace(/\\beta/g, 'β');
      displayText = displayText.replace(/\\gamma/g, 'γ');
      displayText = displayText.replace(/\\sum/g, 'Σ');
      displayText = displayText.replace(/\\int/g, '∫');
      displayText = displayText.replace(/\\infty/g, '∞');

      ctx.fillText(displayText, frame.x + frame.width / 2, frame.y + frame.height / 2);
    }

    // Border
    if (frame.borderWidth > 0) {
      ctx.strokeStyle = frame.borderColor;
      ctx.lineWidth = frame.borderWidth;
      ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
    }
  }

  private renderGraphicFramePDF(frame: GraphicFrame): void {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = frame.backgroundColor;
    ctx.fillRect(frame.x, frame.y, frame.width, frame.height);

    // Note: For actual images, we'd need to load them async
    // This simplified version just shows the frame

    // Border
    if (frame.borderWidth > 0) {
      ctx.strokeStyle = frame.borderColor;
      ctx.lineWidth = frame.borderWidth;
      ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
    }
  }

  private renderTableFramePDF(frame: TableFrame): void {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = frame.backgroundColor;
    ctx.fillRect(frame.x, frame.y, frame.width, frame.height);

    // Table structure
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
          ctx.rect(
            currentX + cellPadding,
            currentY + cellPadding,
            cellWidth - cellPadding * 2,
            cellHeight - cellPadding * 2
          );
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

    // Border
    if (frame.borderWidth > 0) {
      ctx.strokeStyle = frame.borderColor;
      ctx.lineWidth = frame.borderWidth;
      ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
    }
  }
}

// Export as JSON (for saving/loading)
export function exportToJSON(pages: Page[]): string {
  return JSON.stringify({ version: '1.0', pages }, null, 2);
}

export function importFromJSON(json: string): Page[] {
  const data = JSON.parse(json);
  return data.pages;
}
