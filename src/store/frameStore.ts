import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { Frame, Page } from '../types/frame';

interface FrameState {
  pages: Page[];
  currentPageIndex: number;
  selectedFrameId: string | null;
  isDragging: boolean;
  isResizing: boolean;
  dragOffset: { x: number; y: number };
  resizeHandle: string | null;
  tool: 'select' | 'text-frame' | 'graphic-frame' | 'unanchored-frame' | 'pan';
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  zoom: number;

  // Actions
  addPage: () => void;
  removePage: (pageId: string) => void;
  setCurrentPage: (index: number) => void;

  addFrame: (frame: Frame) => void;
  removeFrame: (frameId: string) => void;
  updateFrame: (frameId: string, updates: Partial<Frame>) => void;
  selectFrame: (frameId: string | null) => void;
  duplicateFrame: (frameId: string) => void;

  moveFrame: (frameId: string, x: number, y: number) => void;
  resizeFrame: (frameId: string, width: number, height: number, x?: number, y?: number) => void;
  bringToFront: (frameId: string) => void;
  sendToBack: (frameId: string) => void;
  bringForward: (frameId: string) => void;
  sendBackward: (frameId: string) => void;

  connectFrames: (sourceId: string, targetId: string) => void;
  disconnectFrame: (frameId: string) => void;

  setTool: (tool: FrameState['tool']) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setZoom: (zoom: number) => void;

  setDragging: (isDragging: boolean, offset?: { x: number; y: number }) => void;
  setResizing: (isResizing: boolean, handle?: string | null) => void;

  getCurrentPage: () => Page | null;
  getSelectedFrame: () => Frame | null;
}

const createInitialPage = (): Page => ({
  id: uuidv4(),
  pageNumber: 1,
  frames: [],
  width: 612, // Letter size in points (8.5")
  height: 792, // Letter size in points (11")
});

export const useFrameStore = create<FrameState>()(
  immer((set, get) => ({
    pages: [createInitialPage()],
    currentPageIndex: 0,
    selectedFrameId: null,
    isDragging: false,
    isResizing: false,
    dragOffset: { x: 0, y: 0 },
    resizeHandle: null,
    tool: 'select',
    showGrid: true,
    snapToGrid: true,
    gridSize: 12,
    zoom: 100,

    addPage: () => {
      set((state) => {
        const newPage: Page = {
          id: uuidv4(),
          pageNumber: state.pages.length + 1,
          frames: [],
          width: 612,
          height: 792,
        };
        state.pages.push(newPage);
      });
    },

    removePage: (pageId) => {
      set((state) => {
        if (state.pages.length > 1) {
          const index = state.pages.findIndex((p) => p.id === pageId);
          if (index !== -1) {
            state.pages.splice(index, 1);
            // Renumber pages
            state.pages.forEach((page, i) => {
              page.pageNumber = i + 1;
            });
            if (state.currentPageIndex >= state.pages.length) {
              state.currentPageIndex = state.pages.length - 1;
            }
          }
        }
      });
    },

    setCurrentPage: (index) => {
      set((state) => {
        if (index >= 0 && index < state.pages.length) {
          state.currentPageIndex = index;
          state.selectedFrameId = null;
        }
      });
    },

    addFrame: (frame) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          // Set zIndex to be on top
          const maxZ = page.frames.reduce((max, f) => Math.max(max, f.zIndex), 0);
          frame.zIndex = maxZ + 1;
          page.frames.push(frame);
          state.selectedFrameId = frame.id;
        }
      });
    },

    removeFrame: (frameId) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          const index = page.frames.findIndex((f) => f.id === frameId);
          if (index !== -1) {
            // Disconnect any linked frames
            const frame = page.frames[index];
            if (frame.nextFrameId) {
              const nextFrame = page.frames.find((f) => f.id === frame.nextFrameId);
              if (nextFrame) {
                nextFrame.prevFrameId = undefined;
              }
            }
            if (frame.prevFrameId) {
              const prevFrame = page.frames.find((f) => f.id === frame.prevFrameId);
              if (prevFrame) {
                prevFrame.nextFrameId = undefined;
              }
            }
            page.frames.splice(index, 1);
            if (state.selectedFrameId === frameId) {
              state.selectedFrameId = null;
            }
          }
        }
      });
    },

    updateFrame: (frameId, updates) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          const frame = page.frames.find((f) => f.id === frameId);
          if (frame) {
            Object.assign(frame, updates);
          }
        }
      });
    },

    selectFrame: (frameId) => {
      set((state) => {
        state.selectedFrameId = frameId;
      });
    },

    duplicateFrame: (frameId) => {
      const page = get().pages[get().currentPageIndex];
      if (page) {
        const frame = page.frames.find((f) => f.id === frameId);
        if (frame) {
          const newFrame: Frame = {
            ...frame,
            id: uuidv4(),
            x: frame.x + 20,
            y: frame.y + 20,
            name: `${frame.name} Copy`,
            nextFrameId: undefined,
            prevFrameId: undefined,
          };
          get().addFrame(newFrame);
        }
      }
    },

    moveFrame: (frameId, x, y) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          const frame = page.frames.find((f) => f.id === frameId);
          if (frame && !frame.locked) {
            if (state.snapToGrid) {
              x = Math.round(x / state.gridSize) * state.gridSize;
              y = Math.round(y / state.gridSize) * state.gridSize;
            }
            frame.x = Math.max(0, x);
            frame.y = Math.max(0, y);
          }
        }
      });
    },

    resizeFrame: (frameId, width, height, x?, y?) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          const frame = page.frames.find((f) => f.id === frameId);
          if (frame && !frame.locked) {
            if (state.snapToGrid) {
              width = Math.round(width / state.gridSize) * state.gridSize;
              height = Math.round(height / state.gridSize) * state.gridSize;
            }
            frame.width = Math.max(20, width);
            frame.height = Math.max(20, height);
            if (x !== undefined) frame.x = Math.max(0, x);
            if (y !== undefined) frame.y = Math.max(0, y);
          }
        }
      });
    },

    bringToFront: (frameId) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          const maxZ = page.frames.reduce((max, f) => Math.max(max, f.zIndex), 0);
          const frame = page.frames.find((f) => f.id === frameId);
          if (frame) {
            frame.zIndex = maxZ + 1;
          }
        }
      });
    },

    sendToBack: (frameId) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          const minZ = page.frames.reduce((min, f) => Math.min(min, f.zIndex), Infinity);
          const frame = page.frames.find((f) => f.id === frameId);
          if (frame) {
            frame.zIndex = minZ - 1;
          }
        }
      });
    },

    bringForward: (frameId) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          const frame = page.frames.find((f) => f.id === frameId);
          if (frame) {
            frame.zIndex += 1;
          }
        }
      });
    },

    sendBackward: (frameId) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          const frame = page.frames.find((f) => f.id === frameId);
          if (frame) {
            frame.zIndex -= 1;
          }
        }
      });
    },

    connectFrames: (sourceId, targetId) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          const sourceFrame = page.frames.find((f) => f.id === sourceId);
          const targetFrame = page.frames.find((f) => f.id === targetId);
          if (sourceFrame && targetFrame && sourceFrame.type === 'text' && targetFrame.type === 'text') {
            sourceFrame.nextFrameId = targetId;
            targetFrame.prevFrameId = sourceId;
          }
        }
      });
    },

    disconnectFrame: (frameId) => {
      set((state) => {
        const page = state.pages[state.currentPageIndex];
        if (page) {
          const frame = page.frames.find((f) => f.id === frameId);
          if (frame) {
            if (frame.nextFrameId) {
              const nextFrame = page.frames.find((f) => f.id === frame.nextFrameId);
              if (nextFrame) {
                nextFrame.prevFrameId = undefined;
              }
              frame.nextFrameId = undefined;
            }
          }
        }
      });
    },

    setTool: (tool) => {
      set((state) => {
        state.tool = tool;
        if (tool !== 'select') {
          state.selectedFrameId = null;
        }
      });
    },

    setShowGrid: (show) => {
      set((state) => {
        state.showGrid = show;
      });
    },

    setSnapToGrid: (snap) => {
      set((state) => {
        state.snapToGrid = snap;
      });
    },

    setGridSize: (size) => {
      set((state) => {
        state.gridSize = size;
      });
    },

    setZoom: (zoom) => {
      set((state) => {
        state.zoom = Math.max(25, Math.min(400, zoom));
      });
    },

    setDragging: (isDragging, offset) => {
      set((state) => {
        state.isDragging = isDragging;
        if (offset) {
          state.dragOffset = offset;
        }
      });
    },

    setResizing: (isResizing, handle) => {
      set((state) => {
        state.isResizing = isResizing;
        state.resizeHandle = handle || null;
      });
    },

    getCurrentPage: () => {
      const state = get();
      return state.pages[state.currentPageIndex] || null;
    },

    getSelectedFrame: () => {
      const state = get();
      const page = state.pages[state.currentPageIndex];
      if (page && state.selectedFrameId) {
        return page.frames.find((f) => f.id === state.selectedFrameId) || null;
      }
      return null;
    },
  }))
);
