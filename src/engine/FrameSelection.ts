// Frame Selection and Dragging - handles frame interaction
import type { Frame, Point } from '../document/types';

export interface DragState {
  isDragging: boolean;
  frameId: string | null;
  startPoint: Point;
  frameStartX: number;
  frameStartY: number;
  handle: ResizeHandle | null;
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export function createDragState(): DragState {
  return {
    isDragging: false,
    frameId: null,
    startPoint: { x: 0, y: 0 },
    frameStartX: 0,
    frameStartY: 0,
    handle: null,
  };
}

export function startDrag(
  _state: DragState,
  frameId: string,
  frame: Frame,
  point: Point,
  handle: ResizeHandle | null = null
): DragState {
  return {
    isDragging: true,
    frameId,
    startPoint: point,
    frameStartX: frame.x,
    frameStartY: frame.y,
    handle,
  };
}

export function updateDrag(state: DragState, currentPoint: Point): { dx: number; dy: number } {
  if (!state.isDragging) return { dx: 0, dy: 0 };

  return {
    dx: currentPoint.x - state.startPoint.x,
    dy: currentPoint.y - state.startPoint.y,
  };
}

export function endDrag(): DragState {
  return createDragState();
}

// Calculate new position after drag
export function calculateDragPosition(state: DragState, currentPoint: Point): Point {
  const delta = updateDrag(state, currentPoint);
  return {
    x: state.frameStartX + delta.dx,
    y: state.frameStartY + delta.dy,
  };
}

// Calculate new size after resize
export function calculateResize(
  state: DragState,
  frame: Frame,
  currentPoint: Point
): { x: number; y: number; width: number; height: number } {
  if (!state.handle) {
    return { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
  }

  const delta = updateDrag(state, currentPoint);
  let { x, y, width, height } = frame;

  switch (state.handle) {
    case 'nw':
      x = state.frameStartX + delta.dx;
      y = state.frameStartY + delta.dy;
      width = frame.width - delta.dx;
      height = frame.height - delta.dy;
      break;
    case 'n':
      y = state.frameStartY + delta.dy;
      height = frame.height - delta.dy;
      break;
    case 'ne':
      y = state.frameStartY + delta.dy;
      width = frame.width + delta.dx;
      height = frame.height - delta.dy;
      break;
    case 'e':
      width = frame.width + delta.dx;
      break;
    case 'se':
      width = frame.width + delta.dx;
      height = frame.height + delta.dy;
      break;
    case 's':
      height = frame.height + delta.dy;
      break;
    case 'sw':
      x = state.frameStartX + delta.dx;
      width = frame.width - delta.dx;
      height = frame.height + delta.dy;
      break;
    case 'w':
      x = state.frameStartX + delta.dx;
      width = frame.width - delta.dx;
      break;
  }

  // Ensure minimum size
  width = Math.max(50, width);
  height = Math.max(50, height);

  return { x, y, width, height };
}

// Hit test for frame (check if point is inside frame)
export function hitTestFrame(frame: Frame, point: Point): boolean {
  return (
    point.x >= frame.x &&
    point.x <= frame.x + frame.width &&
    point.y >= frame.y &&
    point.y <= frame.y + frame.height
  );
}

// Hit test for resize handles
export function hitTestHandle(frame: Frame, point: Point, handleSize: number = 8): ResizeHandle | null {
  const halfHandle = handleSize / 2;

  // Check each handle
  const handles: { handle: ResizeHandle; x: number; y: number }[] = [
    { handle: 'nw', x: frame.x, y: frame.y },
    { handle: 'n', x: frame.x + frame.width / 2, y: frame.y },
    { handle: 'ne', x: frame.x + frame.width, y: frame.y },
    { handle: 'e', x: frame.x + frame.width, y: frame.y + frame.height / 2 },
    { handle: 'se', x: frame.x + frame.width, y: frame.y + frame.height },
    { handle: 's', x: frame.x + frame.width / 2, y: frame.y + frame.height },
    { handle: 'sw', x: frame.x, y: frame.y + frame.height },
    { handle: 'w', x: frame.x, y: frame.y + frame.height / 2 },
  ];

  for (const h of handles) {
    if (
      point.x >= h.x - halfHandle &&
      point.x <= h.x + halfHandle &&
      point.y >= h.y - halfHandle &&
      point.y <= h.y + halfHandle
    ) {
      return h.handle;
    }
  }

  return null;
}

// Get cursor style for handle
export function getHandleCursor(handle: ResizeHandle | null): string {
  if (!handle) return 'default';

  const cursors: Record<ResizeHandle, string> = {
    nw: 'nwse-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    e: 'ew-resize',
    se: 'nwse-resize',
    s: 'ns-resize',
    sw: 'nesw-resize',
    w: 'ew-resize',
  };

  return cursors[handle];
}
