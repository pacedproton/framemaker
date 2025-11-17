// Document store - central state management
import { useState, useEffect } from 'react';
import type { EditorState, Page, Frame, TextFrame, Paragraph } from './types';
import { createInitialEditorState, createPage, createParagraph, createTextRun } from './factory';

type Listener = () => void;

class DocumentStore {
  private state: EditorState;
  private listeners: Set<Listener> = new Set();
  private undoStack: EditorState[] = [];
  private redoStack: EditorState[] = [];

  constructor() {
    this.state = createInitialEditorState();
  }

  getState(): EditorState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  private saveUndoState(): void {
    this.undoStack.push(JSON.parse(JSON.stringify(this.state)));
    this.redoStack = [];
    if (this.undoStack.length > 50) {
      this.undoStack.shift();
    }
  }

  private update(updater: (state: EditorState) => void, saveUndo: boolean = false): void {
    if (saveUndo) {
      this.saveUndoState();
    }
    updater(this.state);
    this.state.document.metadata.modifiedAt = Date.now();
    this.notify();
  }

  // Document operations
  newDocument(name: string): void {
    this.update((state) => {
      const newState = createInitialEditorState();
      newState.document.name = name;
      Object.assign(state, newState);
    }, true);
  }

  // Page operations
  getCurrentPage(): Page {
    return this.state.document.pages[this.state.currentPageIndex];
  }

  addPage(): void {
    this.update((state) => {
      const newPageNumber = state.document.pages.length + 1;
      const newPage = createPage(newPageNumber);
      state.document.pages.push(newPage);

      // Register frame in flow
      const textFrame = newPage.frames.find((f) => f.type === 'text') as TextFrame | undefined;
      if (textFrame) {
        state.document.flows[0].frameIds.push(textFrame.id);
      }
    }, true);
  }

  setCurrentPage(index: number): void {
    this.update((state) => {
      if (index >= 0 && index < state.document.pages.length) {
        state.currentPageIndex = index;
        state.editingFrameId = null;
        state.cursor = null;
        state.selection = null;
      }
    });
  }

  // Frame operations
  getFrame(frameId: string): Frame | null {
    for (const page of this.state.document.pages) {
      const frame = page.frames.find((f) => f.id === frameId);
      if (frame) return frame;
    }
    return null;
  }

  getTextFrame(frameId: string): TextFrame | null {
    const frame = this.getFrame(frameId);
    return frame && frame.type === 'text' ? frame : null;
  }

  selectFrame(frameId: string | null): void {
    this.update((state) => {
      if (frameId) {
        state.selectedFrameIds = [frameId];
      } else {
        state.selectedFrameIds = [];
      }
      state.editingFrameId = null;
      state.cursor = null;
      state.selection = null;
    });
  }

  moveFrame(frameId: string, x: number, y: number): void {
    this.update((state) => {
      const frame = this.findFrame(state, frameId);
      if (frame && !frame.locked) {
        frame.x = x;
        frame.y = y;
      }
    }, true);
  }

  resizeFrame(frameId: string, width: number, height: number): void {
    this.update((state) => {
      const frame = this.findFrame(state, frameId);
      if (frame && !frame.locked) {
        frame.width = Math.max(50, width);
        frame.height = Math.max(50, height);
      }
    }, true);
  }

  addTextFrame(frame: Frame): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      if (page) {
        page.frames.push(frame);

        // Add to flow if it's a text frame
        if (frame.type === 'text') {
          const textFrame = frame as TextFrame;
          const flow = state.document.flows.find((f) => f.tag === textFrame.flowTag);
          if (flow) {
            flow.frameIds.push(frame.id);
          }
        }
      }
    }, true);
  }

  deleteFrame(frameId: string): void {
    this.update((state) => {
      for (const page of state.document.pages) {
        const index = page.frames.findIndex((f) => f.id === frameId);
        if (index !== -1) {
          page.frames.splice(index, 1);
          break;
        }
      }
      state.selectedFrameIds = state.selectedFrameIds.filter((id) => id !== frameId);
    }, true);
  }

  private findFrame(state: EditorState, frameId: string): Frame | null {
    for (const page of state.document.pages) {
      const frame = page.frames.find((f) => f.id === frameId);
      if (frame) return frame;
    }
    return null;
  }

  // Text editing operations
  startTextEditing(frameId: string): void {
    this.update((state) => {
      const frame = this.findFrame(state, frameId);
      if (frame && frame.type === 'text') {
        state.editingFrameId = frameId;
        const textFrame = frame as TextFrame;
        if (textFrame.paragraphs.length > 0) {
          const firstPara = textFrame.paragraphs[0];
          const textLength = this.getParagraphTextLength(firstPara);
          state.cursor = {
            paragraphId: firstPara.id,
            offset: textLength,
          };
        }
        state.selection = null;
        state.selectedFrameIds = [];
        state.activeTool = 'text';
      }
    });
  }

  stopTextEditing(): void {
    this.update((state) => {
      state.editingFrameId = null;
      state.cursor = null;
      state.selection = null;
    });
  }

  private getParagraphTextLength(para: Paragraph): number {
    let len = 0;
    for (const elem of para.content) {
      if ('text' in elem) {
        len += elem.text.length;
      }
    }
    return len;
  }

  insertText(text: string): void {
    if (!this.state.editingFrameId || !this.state.cursor) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (!para) return;

      // Find the text run at cursor position
      let currentOffset = 0;
      for (let i = 0; i < para.content.length; i++) {
        const elem = para.content[i];
        if ('text' in elem) {
          const runLength = elem.text.length;
          if (currentOffset + runLength >= state.cursor!.offset) {
            // Insert text here
            const insertPos = state.cursor!.offset - currentOffset;
            elem.text = elem.text.slice(0, insertPos) + text + elem.text.slice(insertPos);
            state.cursor!.offset += text.length;
            return;
          }
          currentOffset += runLength;
        }
      }

      // Cursor is at end, append to last run or create new
      if (para.content.length > 0) {
        const lastElem = para.content[para.content.length - 1];
        if ('text' in lastElem) {
          lastElem.text += text;
          state.cursor!.offset += text.length;
        }
      } else {
        para.content.push(createTextRun(text));
        state.cursor!.offset = text.length;
      }
    }, false);
  }

  insertParagraph(): void {
    if (!this.state.editingFrameId || !this.state.cursor) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const paraIndex = frame.paragraphs.findIndex((p) => p.id === state.cursor!.paragraphId);
      if (paraIndex === -1) return;

      const para = frame.paragraphs[paraIndex];

      // Split paragraph at cursor
      let currentOffset = 0;
      let splitRunIndex = -1;
      let splitPos = 0;

      for (let i = 0; i < para.content.length; i++) {
        const elem = para.content[i];
        if ('text' in elem) {
          const runLength = elem.text.length;
          if (currentOffset + runLength >= state.cursor!.offset) {
            splitRunIndex = i;
            splitPos = state.cursor!.offset - currentOffset;
            break;
          }
          currentOffset += runLength;
        }
      }

      // Create new paragraph
      const newPara = createParagraph('', para.formatTag);

      if (splitRunIndex !== -1) {
        const elem = para.content[splitRunIndex];
        if ('text' in elem) {
          // Split the text run
          const remainingText = elem.text.slice(splitPos);
          elem.text = elem.text.slice(0, splitPos);

          if (remainingText) {
            newPara.content = [createTextRun(remainingText)];
          }

          // Move subsequent runs to new paragraph
          const remainingRuns = para.content.splice(splitRunIndex + 1);
          newPara.content.push(...remainingRuns);
        }
      }

      // Insert new paragraph
      frame.paragraphs.splice(paraIndex + 1, 0, newPara);

      // Move cursor to start of new paragraph
      state.cursor = {
        paragraphId: newPara.id,
        offset: 0,
      };
    }, true);
  }

  deleteBackward(): void {
    if (!this.state.editingFrameId || !this.state.cursor) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const paraIndex = frame.paragraphs.findIndex((p) => p.id === state.cursor!.paragraphId);
      if (paraIndex === -1) return;

      const para = frame.paragraphs[paraIndex];

      if (state.cursor!.offset === 0) {
        // At start of paragraph, merge with previous
        if (paraIndex > 0) {
          const prevPara = frame.paragraphs[paraIndex - 1];
          const prevLength = this.getParagraphTextLength(prevPara);
          prevPara.content.push(...para.content);
          frame.paragraphs.splice(paraIndex, 1);
          state.cursor = {
            paragraphId: prevPara.id,
            offset: prevLength,
          };
        }
        return;
      }

      // Delete character before cursor
      let currentOffset = 0;
      for (let i = 0; i < para.content.length; i++) {
        const elem = para.content[i];
        if ('text' in elem) {
          const runLength = elem.text.length;
          if (currentOffset + runLength >= state.cursor!.offset) {
            const deletePos = state.cursor!.offset - currentOffset - 1;
            elem.text = elem.text.slice(0, deletePos) + elem.text.slice(deletePos + 1);
            state.cursor!.offset--;

            // Remove empty run
            if (elem.text.length === 0) {
              para.content.splice(i, 1);
            }
            return;
          }
          currentOffset += runLength;
        }
      }
    }, false);
  }

  setCursorPosition(paragraphId: string, offset: number): void {
    this.update((state) => {
      state.cursor = { paragraphId, offset };
      state.selection = null;
    });
  }

  setSelection(
    startParagraphId: string,
    startOffset: number,
    endParagraphId: string,
    endOffset: number
  ): void {
    this.update((state) => {
      state.selection = {
        startParagraphId,
        startOffset,
        endParagraphId,
        endOffset,
      };
      state.cursor = { paragraphId: endParagraphId, offset: endOffset };
    });
  }

  // Character formatting
  applyCharacterFormat(_tag: string): void {
    if (!this.state.selection || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      // Apply tag to selection - simplified for now
      // In full implementation, this would split runs and apply the tag
    }, true);
  }

  toggleBold(): void {
    if (!this.state.selection || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      // Toggle bold on selection - simplified
    }, true);
  }

  toggleItalic(): void {
    if (!this.state.selection || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      // Toggle italic on selection - simplified
    }, true);
  }

  // Paragraph formatting
  applyParagraphFormat(tag: string): void {
    if (!this.state.cursor || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (para) {
        para.formatTag = tag;
      }
    }, true);
  }

  // View operations
  setZoom(zoom: number): void {
    this.update((state) => {
      state.zoom = Math.max(25, Math.min(400, zoom));
    });
  }

  setActiveTool(tool: EditorState['activeTool']): void {
    this.update((state) => {
      state.activeTool = tool;
      if (tool !== 'text') {
        state.editingFrameId = null;
        state.cursor = null;
        state.selection = null;
      }
    });
  }

  toggleGrid(): void {
    this.update((state) => {
      state.showGrid = !state.showGrid;
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

  // Undo/Redo
  undo(): void {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(JSON.parse(JSON.stringify(this.state)));
    this.state = this.undoStack.pop()!;
    this.notify();
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(JSON.parse(JSON.stringify(this.state)));
    this.state = this.redoStack.pop()!;
    this.notify();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}

// Singleton store instance
export const store = new DocumentStore();

// React hook
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
