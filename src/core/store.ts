// Global state management for FrameMaker
import type {
  EditorState,
  Tool,
  Frame,
  TextFrame,
  MathFrame,
  GraphicFrame,
  TableFrame,
  Page,
  TextRun,
} from './types';
import {
  createDocument,
  createPage,
  createTextFrame,
  createMathFrame,
  createGraphicFrame,
  createTableFrame,
} from './types';

// Simple reactive store
type Listener = () => void;

class Store {
  private state: EditorState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): EditorState {
    return {
      document: createDocument('Untitled Document'),
      currentPageIndex: 0,
      selectedFrameId: null,
      activeTool: 'select',
      zoom: 100,
      showGrid: true,
      gridSize: 18, // 1/4 inch at 72 dpi
      showRulers: true,
      showMargins: true,
      showFrameBorders: true,
      clipboard: null,
    };
  }

  getState(): EditorState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private update(updater: (state: EditorState) => void): void {
    updater(this.state);
    this.state.document.modified = new Date();
    this.notify();
  }

  // Document operations
  newDocument(name: string): void {
    this.update((state) => {
      state.document = createDocument(name);
      state.currentPageIndex = 0;
      state.selectedFrameId = null;
    });
  }

  // Page operations
  addPage(): void {
    this.update((state) => {
      const newPageNumber = state.document.pages.length + 1;
      const newPage = createPage(newPageNumber);
      state.document.pages.push(newPage);
    });
  }

  removePage(pageIndex: number): void {
    this.update((state) => {
      if (state.document.pages.length > 1) {
        state.document.pages.splice(pageIndex, 1);
        // Renumber pages
        state.document.pages.forEach((page, i) => {
          page.pageNumber = i + 1;
        });
        // Adjust current page if needed
        if (state.currentPageIndex >= state.document.pages.length) {
          state.currentPageIndex = state.document.pages.length - 1;
        }
      }
    });
  }

  setCurrentPage(index: number): void {
    this.update((state) => {
      if (index >= 0 && index < state.document.pages.length) {
        state.currentPageIndex = index;
        state.selectedFrameId = null;
      }
    });
  }

  getCurrentPage(): Page {
    return this.state.document.pages[this.state.currentPageIndex];
  }

  // Frame operations
  addFrame(
    type: 'text' | 'math' | 'graphic' | 'table',
    x: number,
    y: number,
    width: number,
    height: number,
    options?: { rows?: number; cols?: number }
  ): string {
    let newFrame: TextFrame | MathFrame | GraphicFrame | TableFrame;
    const page = this.getCurrentPage();

    switch (type) {
      case 'text':
        newFrame = createTextFrame(page.id, x, y, width, height);
        break;
      case 'math':
        newFrame = createMathFrame(page.id, x, y, width, height);
        break;
      case 'graphic':
        newFrame = createGraphicFrame(page.id, x, y, width, height);
        break;
      case 'table':
        newFrame = createTableFrame(
          page.id,
          x,
          y,
          width,
          height,
          options?.rows || 3,
          options?.cols || 3
        );
        break;
    }

    // Set zIndex to be on top
    newFrame.zIndex = page.frames.length;

    this.update((state) => {
      const currentPage = state.document.pages[state.currentPageIndex];
      currentPage.frames.push(newFrame);
      state.selectedFrameId = newFrame.id;
    });

    return newFrame.id;
  }

  removeFrame(frameId: string): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const index = page.frames.findIndex((f) => f.id === frameId);
      if (index !== -1) {
        page.frames.splice(index, 1);
        if (state.selectedFrameId === frameId) {
          state.selectedFrameId = null;
        }
      }
    });
  }

  selectFrame(frameId: string | null): void {
    this.update((state) => {
      state.selectedFrameId = frameId;
    });
  }

  getSelectedFrame(): Frame | null {
    const page = this.getCurrentPage();
    if (!this.state.selectedFrameId) return null;
    return page.frames.find((f) => f.id === this.state.selectedFrameId) || null;
  }

  moveFrame(frameId: string, x: number, y: number): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const frame = page.frames.find((f) => f.id === frameId);
      if (frame && !frame.locked) {
        frame.x = x;
        frame.y = y;
      }
    });
  }

  resizeFrame(frameId: string, width: number, height: number): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const frame = page.frames.find((f) => f.id === frameId);
      if (frame && !frame.locked) {
        frame.width = Math.max(20, width);
        frame.height = Math.max(20, height);
      }
    });
  }

  setFramePosition(frameId: string, x: number, y: number, width: number, height: number): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const frame = page.frames.find((f) => f.id === frameId);
      if (frame && !frame.locked) {
        frame.x = x;
        frame.y = y;
        frame.width = Math.max(20, width);
        frame.height = Math.max(20, height);
      }
    });
  }

  rotateFrame(frameId: string, angle: number): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const frame = page.frames.find((f) => f.id === frameId);
      if (frame && !frame.locked) {
        frame.rotation = angle % 360;
      }
    });
  }

  bringToFront(frameId: string): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const maxZ = Math.max(...page.frames.map((f) => f.zIndex));
      const frame = page.frames.find((f) => f.id === frameId);
      if (frame) {
        frame.zIndex = maxZ + 1;
      }
    });
  }

  sendToBack(frameId: string): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const minZ = Math.min(...page.frames.map((f) => f.zIndex));
      const frame = page.frames.find((f) => f.id === frameId);
      if (frame) {
        frame.zIndex = minZ - 1;
      }
    });
  }

  lockFrame(frameId: string, locked: boolean): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const frame = page.frames.find((f) => f.id === frameId);
      if (frame) {
        frame.locked = locked;
      }
    });
  }

  // Text frame operations
  connectTextFrames(sourceId: string, targetId: string): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const source = page.frames.find((f) => f.id === sourceId) as TextFrame | undefined;
      const target = page.frames.find((f) => f.id === targetId) as TextFrame | undefined;

      if (source && target && source.type === 'text' && target.type === 'text') {
        source.nextFrameId = targetId;
        target.prevFrameId = sourceId;
      }
    });
  }

  setTextContent(frameId: string, content: TextRun[]): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const frame = page.frames.find((f) => f.id === frameId) as TextFrame | undefined;
      if (frame && frame.type === 'text') {
        frame.content = content;
      }
    });
  }

  // Math frame operations
  setMathLatex(frameId: string, latex: string): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const frame = page.frames.find((f) => f.id === frameId) as MathFrame | undefined;
      if (frame && frame.type === 'math') {
        frame.latex = latex;
      }
    });
  }

  // Graphic frame operations
  setGraphicImage(frameId: string, imageUrl: string): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      const frame = page.frames.find((f) => f.id === frameId) as GraphicFrame | undefined;
      if (frame && frame.type === 'graphic') {
        frame.imageUrl = imageUrl;
      }
    });
  }

  // Tool operations
  setTool(tool: Tool): void {
    this.update((state) => {
      state.activeTool = tool;
    });
  }

  // View operations
  setZoom(zoom: number): void {
    this.update((state) => {
      state.zoom = Math.max(10, Math.min(400, zoom));
    });
  }

  toggleGrid(): void {
    this.update((state) => {
      state.showGrid = !state.showGrid;
    });
  }

  toggleRulers(): void {
    this.update((state) => {
      state.showRulers = !state.showRulers;
    });
  }

  toggleMargins(): void {
    this.update((state) => {
      state.showMargins = !state.showMargins;
    });
  }

  toggleFrameBorders(): void {
    this.update((state) => {
      state.showFrameBorders = !state.showFrameBorders;
    });
  }

  // Clipboard operations
  copyFrame(): void {
    const frame = this.getSelectedFrame();
    if (frame) {
      this.update((state) => {
        state.clipboard = JSON.parse(JSON.stringify(frame));
      });
    }
  }

  pasteFrame(): void {
    if (this.state.clipboard) {
      const cloned = JSON.parse(JSON.stringify(this.state.clipboard));
      cloned.id = `frame_${Date.now()}_paste`;
      cloned.x += 20;
      cloned.y += 20;
      cloned.pageId = this.getCurrentPage().id;

      this.update((state) => {
        const page = state.document.pages[state.currentPageIndex];
        cloned.zIndex = page.frames.length;
        page.frames.push(cloned);
        state.selectedFrameId = cloned.id;
      });
    }
  }

  duplicateFrame(frameId: string): void {
    const page = this.getCurrentPage();
    const frame = page.frames.find((f) => f.id === frameId);
    if (frame) {
      const cloned = JSON.parse(JSON.stringify(frame));
      cloned.id = `frame_${Date.now()}_dup`;
      cloned.x += 20;
      cloned.y += 20;

      this.update((state) => {
        const currentPage = state.document.pages[state.currentPageIndex];
        cloned.zIndex = currentPage.frames.length;
        currentPage.frames.push(cloned);
        state.selectedFrameId = cloned.id;
      });
    }
  }

  // Snap to grid
  snapToGrid(value: number): number {
    if (!this.state.showGrid) return value;
    const gridSize = this.state.gridSize;
    return Math.round(value / gridSize) * gridSize;
  }
}

// Singleton store instance
export const store = new Store();

// React hook for using the store
import { useState, useEffect } from 'react';

export function useStore(): EditorState {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState({ ...store.getState() });
    });
    return unsubscribe;
  }, []);

  return state;
}
