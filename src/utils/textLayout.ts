// Text layout and overflow detection utilities
import type { TextFrame, Paragraph, ParagraphProperties } from '../document/types';
import { defaultParagraphProperties } from '../document/types';

/**
 * Calculate the required height for a paragraph with given properties
 */
export const calculateParagraphHeight = (
  para: Paragraph,
  props: ParagraphProperties,
  frameWidth: number
): number => {
  const fontSize = props.defaultFont.size;
  const lineHeight = fontSize * props.lineSpacing;

  // Calculate total text length (simplified - doesn't account for wrapping)
  let totalChars = 0;
  for (const elem of para.content) {
    if ('text' in elem) {
      totalChars += elem.text.length;
    }
  }

  // Estimate number of lines (rough approximation)
  // Average character width is approximately 0.5em for proportional fonts
  const availableWidth = frameWidth - props.leftIndent - props.rightIndent - 12; // 12px for padding
  const avgCharWidth = fontSize * 0.5;
  const charsPerLine = Math.floor(availableWidth / avgCharWidth);
  const estimatedLines = Math.max(1, Math.ceil(totalChars / charsPerLine));

  const contentHeight = estimatedLines * lineHeight;
  const totalHeight = props.spaceAbove + contentHeight + props.spaceBelow;

  return totalHeight;
};

/**
 * Detect if a text frame has overflow (content exceeds frame height)
 */
export const detectFrameOverflow = (
  frame: TextFrame,
  paragraphFormats: Map<string, ParagraphProperties>
): boolean => {
  const contentHeight = calculateFrameContentHeight(frame, paragraphFormats);
  const availableHeight = frame.height - 12; // Subtract padding

  return contentHeight > availableHeight;
};

/**
 * Calculate total content height for a text frame
 */
export const calculateFrameContentHeight = (
  frame: TextFrame,
  paragraphFormats: Map<string, ParagraphProperties>
): number => {
  let totalHeight = 0;

  for (let i = 0; i < frame.paragraphs.length; i++) {
    const para = frame.paragraphs[i];
    const format = paragraphFormats.get(para.formatTag) || defaultParagraphProperties;
    const props = para.overrides ? { ...format, ...para.overrides } : format;

    const paraHeight = calculateParagraphHeight(para, props, frame.width);
    totalHeight += paraHeight;
  }

  return totalHeight;
};

/**
 * Split paragraphs between frames when text flows across pages
 * Returns paragraphs that fit in the current frame and paragraphs that overflow
 */
export const splitParagraphsForFlow = (
  paragraphs: Paragraph[],
  frameHeight: number,
  frameWidth: number,
  paragraphFormats: Map<string, ParagraphProperties>
): { fitted: Paragraph[]; overflow: Paragraph[] } => {
  const availableHeight = frameHeight - 12; // Subtract padding
  let currentHeight = 0;
  let splitIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const format = paragraphFormats.get(para.formatTag) || defaultParagraphProperties;
    const props = para.overrides ? { ...format, ...para.overrides } : format;

    const paraHeight = calculateParagraphHeight(para, props, frameWidth);

    if (currentHeight + paraHeight > availableHeight) {
      splitIndex = i;
      break;
    }

    currentHeight += paraHeight;
    splitIndex = i + 1;
  }

  return {
    fitted: paragraphs.slice(0, splitIndex),
    overflow: paragraphs.slice(splitIndex),
  };
};

/**
 * Create a format map from the catalog for quick lookups
 */
export const createFormatMap = (
  formats: Array<{ tag: string; properties: ParagraphProperties }>
): Map<string, ParagraphProperties> => {
  const map = new Map<string, ParagraphProperties>();
  for (const format of formats) {
    map.set(format.tag, format.properties);
  }
  return map;
};
