// Frame Drawing Tool - allows drawing new text frames
import type { TextFrame } from '../document/types';
import { generateId } from '../document/types';
import { createParagraph } from '../document/factory';

export interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function createDrawingState(): DrawingState {
  return {
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  };
}

export function startDrawing(state: DrawingState, x: number, y: number): DrawingState {
  return {
    ...state,
    isDrawing: true,
    startX: x,
    startY: y,
    currentX: x,
    currentY: y,
  };
}

export function updateDrawing(state: DrawingState, x: number, y: number): DrawingState {
  if (!state.isDrawing) return state;

  return {
    ...state,
    currentX: x,
    currentY: y,
  };
}

export function endDrawing(state: DrawingState): DrawingState {
  return {
    ...state,
    isDrawing: false,
  };
}

export function getDrawingRect(
  state: DrawingState
): { x: number; y: number; width: number; height: number } | null {
  if (!state.isDrawing) return null;

  const x = Math.min(state.startX, state.currentX);
  const y = Math.min(state.startY, state.currentY);
  const width = Math.abs(state.currentX - state.startX);
  const height = Math.abs(state.currentY - state.startY);

  return { x, y, width, height };
}

export function createTextFrameFromDrawing(
  state: DrawingState,
  pageId: string,
  flowTag: string = 'A'
): TextFrame | null {
  const rect = getDrawingRect(state);
  if (!rect || rect.width < 20 || rect.height < 20) {
    return null; // Too small
  }

  const frame: TextFrame = {
    id: generateId('textframe'),
    type: 'text',
    pageId,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    strokeWidth: 1,
    strokeColor: '#000000',
    fillColor: 'transparent',
    flowTag,
    columns: 1,
    columnGap: 12,
    paragraphs: [createParagraph('')],
    nextFrameId: null,
    prevFrameId: null,
    overflow: false,
  };

  return frame;
}

// Snap to grid helper
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

// Snap rectangle to grid
export function snapRectToGrid(
  rect: { x: number; y: number; width: number; height: number },
  gridSize: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: snapToGrid(rect.x, gridSize),
    y: snapToGrid(rect.y, gridSize),
    width: snapToGrid(rect.width, gridSize),
    height: snapToGrid(rect.height, gridSize),
  };
}

// Constrain to page bounds
export function constrainToPage(
  rect: { x: number; y: number; width: number; height: number },
  pageWidth: number,
  pageHeight: number
): { x: number; y: number; width: number; height: number } {
  let { x, y, width, height } = rect;

  // Constrain position
  x = Math.max(0, Math.min(x, pageWidth - width));
  y = Math.max(0, Math.min(y, pageHeight - height));

  // Constrain size
  width = Math.min(width, pageWidth - x);
  height = Math.min(height, pageHeight - y);

  return { x, y, width, height };
}
