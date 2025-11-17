// Text Reflow Engine - handles text flow between frames
import type { TextFrame, Paragraph, Flow, FMDocument, CharacterProperties } from '../document/types';
import { defaultParagraphProperties } from '../document/types';

export interface LineBox {
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
}

export interface FrameLayout {
  frameId: string;
  lines: LineBox[];
  overflowParagraphIndex: number | null;
  overflowCharOffset: number | null;
}

// Simple text measurement (in production, would use canvas or DOM measurement)
function measureText(
  text: string,
  _fontFamily: string,
  fontSize: number,
  _fontWeight: string = 'normal'
): number {
  // Approximate character widths (simplified)
  const avgCharWidth = fontSize * 0.5;
  return text.length * avgCharWidth;
}

function measureWord(word: string, props: CharacterProperties): number {
  return measureText(word, props.family, props.size, props.weight);
}

// Get the text content of a paragraph
export function getParagraphText(para: Paragraph): string {
  let text = '';
  for (const elem of para.content) {
    if ('text' in elem) {
      text += elem.text;
    }
  }
  return text;
}

// Break paragraph into lines that fit within width
export function breakParagraphIntoLines(
  para: Paragraph,
  availableWidth: number,
  startY: number,
  format: typeof defaultParagraphProperties
): LineBox[] {
  const lines: LineBox[] = [];
  const text = getParagraphText(para);
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) {
    // Empty paragraph - still takes space
    lines.push({
      paragraphId: para.id,
      startOffset: 0,
      endOffset: 0,
      x: format.leftIndent,
      y: startY,
      width: 0,
      height: format.defaultFont.size * format.lineSpacing,
      baseline: format.defaultFont.size,
    });
    return lines;
  }

  let currentLine = '';
  let currentWidth = 0;
  let lineY = startY;
  let charOffset = 0;
  let lineStartOffset = 0;
  const spaceWidth = measureWord(' ', format.defaultFont);
  const lineHeight = format.defaultFont.size * format.lineSpacing;

  // First line has special indent
  let lineIndent = format.firstIndent + format.leftIndent;
  let effectiveWidth = availableWidth - lineIndent - format.rightIndent;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWidth = measureWord(word, format.defaultFont);

    if (currentLine === '') {
      // First word on line
      currentLine = word;
      currentWidth = wordWidth;
    } else if (currentWidth + spaceWidth + wordWidth <= effectiveWidth) {
      // Word fits on current line
      currentLine += ' ' + word;
      currentWidth += spaceWidth + wordWidth;
    } else {
      // Word doesn't fit - start new line
      const lineEndOffset = charOffset;

      lines.push({
        paragraphId: para.id,
        startOffset: lineStartOffset,
        endOffset: lineEndOffset,
        x: lineIndent,
        y: lineY,
        width: currentWidth,
        height: lineHeight,
        baseline: format.defaultFont.size,
      });

      lineY += lineHeight;
      lineStartOffset = lineEndOffset;
      charOffset = lineEndOffset;

      // Subsequent lines don't have first line indent
      lineIndent = format.leftIndent;
      effectiveWidth = availableWidth - lineIndent - format.rightIndent;

      currentLine = word;
      currentWidth = wordWidth;
    }

    charOffset += word.length + (i < words.length - 1 ? 1 : 0); // +1 for space
  }

  // Last line
  if (currentLine !== '') {
    lines.push({
      paragraphId: para.id,
      startOffset: lineStartOffset,
      endOffset: charOffset,
      x: lineIndent,
      y: lineY,
      width: currentWidth,
      height: lineHeight,
      baseline: format.defaultFont.size,
    });
  }

  return lines;
}

// Layout paragraphs in a text frame
export function layoutFrame(frame: TextFrame, document: FMDocument): FrameLayout {
  const layout: FrameLayout = {
    frameId: frame.id,
    lines: [],
    overflowParagraphIndex: null,
    overflowCharOffset: null,
  };

  const padding = 6; // Frame padding
  const availableWidth = frame.width - padding * 2;
  const availableHeight = frame.height - padding * 2;

  let currentY = 0;

  for (let paraIndex = 0; paraIndex < frame.paragraphs.length; paraIndex++) {
    const para = frame.paragraphs[paraIndex];

    // Get paragraph format
    const formatDef = document.catalog.paragraphFormats.find((f) => f.tag === para.formatTag);
    const format = formatDef ? formatDef.properties : defaultParagraphProperties;

    // Add space above (except for first paragraph)
    if (paraIndex > 0) {
      currentY += format.spaceAbove;
    }

    // Check if we still have space
    if (currentY >= availableHeight) {
      layout.overflowParagraphIndex = paraIndex;
      layout.overflowCharOffset = 0;
      break;
    }

    // Break paragraph into lines
    const lines = breakParagraphIntoLines(para, availableWidth, currentY, format);

    // Add lines to layout, checking for overflow
    for (const line of lines) {
      if (line.y + line.height > availableHeight) {
        // This line overflows
        layout.overflowParagraphIndex = paraIndex;
        layout.overflowCharOffset = line.startOffset;
        break;
      }
      layout.lines.push(line);
    }

    if (layout.overflowParagraphIndex !== null) {
      break;
    }

    // Update Y position
    const lastLine = lines[lines.length - 1];
    currentY = lastLine.y + lastLine.height + format.spaceBelow;
  }

  return layout;
}

// Flow text across multiple connected frames
export function reflowTextAcrossFrames(flow: Flow, document: FMDocument): Map<string, FrameLayout> {
  const layouts = new Map<string, FrameLayout>();

  if (flow.frameIds.length === 0) {
    return layouts;
  }

  // Get all frames in flow order
  const frames: TextFrame[] = [];
  for (const frameId of flow.frameIds) {
    for (const page of document.pages) {
      const frame = page.frames.find((f) => f.id === frameId && f.type === 'text');
      if (frame) {
        frames.push(frame as TextFrame);
        break;
      }
    }
  }

  if (frames.length === 0) {
    return layouts;
  }

  // Collect all paragraphs from all frames in the flow
  const allParagraphs: Paragraph[] = [];
  for (const frame of frames) {
    allParagraphs.push(...frame.paragraphs);
  }

  // Layout paragraphs across frames
  let currentParaIndex = 0;
  let currentCharOffset = 0;

  for (const frame of frames) {
    const layout: FrameLayout = {
      frameId: frame.id,
      lines: [],
      overflowParagraphIndex: null,
      overflowCharOffset: null,
    };

    const padding = 6;
    const availableWidth = frame.width - padding * 2;
    const availableHeight = frame.height - padding * 2;

    let currentY = 0;

    while (currentParaIndex < allParagraphs.length) {
      const para = allParagraphs[currentParaIndex];

      // Get paragraph format
      const formatDef = document.catalog.paragraphFormats.find((f) => f.tag === para.formatTag);
      const format = formatDef ? formatDef.properties : defaultParagraphProperties;

      // Add space above
      if (layout.lines.length > 0 && currentCharOffset === 0) {
        currentY += format.spaceAbove;
      }

      // Check if we still have space
      if (currentY >= availableHeight) {
        layout.overflowParagraphIndex = currentParaIndex;
        layout.overflowCharOffset = currentCharOffset;
        break;
      }

      // Break paragraph into lines (starting from currentCharOffset)
      const lines = breakParagraphIntoLines(para, availableWidth, currentY, format);

      // Add lines to layout, checking for overflow
      let paragraphCompleted = true;
      for (const line of lines) {
        if (line.y + line.height > availableHeight) {
          // This line overflows
          layout.overflowParagraphIndex = currentParaIndex;
          layout.overflowCharOffset = line.startOffset;
          paragraphCompleted = false;
          break;
        }
        layout.lines.push(line);
      }

      if (!paragraphCompleted) {
        break;
      }

      // Move to next paragraph
      currentParaIndex++;
      currentCharOffset = 0;

      // Update Y position
      const lastLine = lines[lines.length - 1];
      currentY = lastLine.y + lastLine.height + format.spaceBelow;
    }

    layouts.set(frame.id, layout);
  }

  return layouts;
}

// Check if a frame has overflow
export function hasOverflow(frame: TextFrame, document: FMDocument): boolean {
  const layout = layoutFrame(frame, document);
  return layout.overflowParagraphIndex !== null;
}
