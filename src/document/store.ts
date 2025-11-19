// Document store - central state management
import { useState, useEffect } from 'react';
import type { EditorState, Page, Frame, TextFrame, Paragraph, EquationInline, TableInline } from './types';
import { createInitialEditorState, createPage, createParagraph, createTextRun, createImageFrame } from './factory';
import { generateId } from './types';
import { createTable } from '../engine/TableEngine';
import { escapeRegex } from '../utils/textSearch';
import { detectFrameOverflow, createFormatMap } from '../utils/textLayout';

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

    const frameId = this.state.editingFrameId;
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

    // Update overflow detection
    this.updateTextFrameOverflow(frameId);

    // Trigger reflow if there's overflow and connected frames
    const frame = this.getTextFrame(frameId);
    if (frame && frame.overflow && frame.nextFrameId) {
      this.reflowText(frameId);
    }
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

    // Update overflow detection
    if (this.state.editingFrameId) {
      this.updateTextFrameOverflow(this.state.editingFrameId);
    }
  }

  deleteBackward(): void {
    if (!this.state.editingFrameId || !this.state.cursor) return;
    const frameId = this.state.editingFrameId;

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

    // Update overflow detection
    this.updateTextFrameOverflow(frameId);
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
  applyCharacterFormat(tag: string): void {
    if (!this.state.cursor || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find(p => p.id === state.cursor!.paragraphId);
      if (!para) return;

      // Apply character format to current text run
      for (const elem of para.content) {
        if ('text' in elem) {
          elem.characterTag = tag;
        }
      }
    }, true);
  }

  // Paragraph formatting catalogs
  createParagraphFormat(tag: string): void {
    this.update((state) => {
      // Check if format already exists
      if (state.document.catalog.paragraphFormats.find(f => f.tag === tag)) {
        return;
      }

      // Create new format based on Body
      const bodyFormat = state.document.catalog.paragraphFormats.find(f => f.tag === 'Body');
      const newFormat = {
        tag,
        properties: bodyFormat ? { ...bodyFormat.properties } : {
          firstIndent: 0,
          leftIndent: 0,
          rightIndent: 0,
          spaceAbove: 0,
          spaceBelow: 12,
          lineSpacing: 1.5,
          alignment: 'left' as const,
          tabStops: [],
          defaultFont: {
            family: 'Times New Roman',
            size: 12,
            weight: 'normal' as const,
            style: 'normal' as const,
            color: '#000000',
            underline: false,
            strikethrough: false,
            superscript: false,
            subscript: false,
            tracking: 0,
          },
          keepWithNext: false,
          keepWithPrevious: false,
          widowLines: 2,
          orphanLines: 2,
        },
      };

      state.document.catalog.paragraphFormats.push(newFormat);
    }, true);
  }

  deleteParagraphFormat(tag: string): void {
    this.update((state) => {
      if (tag === 'Body') return; // Cannot delete Body format

      const index = state.document.catalog.paragraphFormats.findIndex(f => f.tag === tag);
      if (index !== -1) {
        state.document.catalog.paragraphFormats.splice(index, 1);

        // Update all paragraphs using this format to use Body instead
        for (const page of state.document.pages) {
          for (const frame of page.frames) {
            if (frame.type === 'text') {
              for (const para of (frame as TextFrame).paragraphs) {
                if (para.formatTag === tag) {
                  para.formatTag = 'Body';
                }
              }
            }
          }
        }
      }
    }, true);
  }

  // Character formatting catalogs
  createCharacterFormat(tag: string): void {
    this.update((state) => {
      // Check if format already exists
      if (state.document.catalog.characterFormats.find(f => f.tag === tag)) {
        return;
      }

      // Create new format with minimal properties
      const newFormat = {
        tag,
        properties: {
          weight: 'bold' as const,
        },
      };

      state.document.catalog.characterFormats.push(newFormat);
    }, true);
  }

  deleteCharacterFormat(tag: string): void {
    this.update((state) => {
      if (tag === 'Default') return; // Cannot delete Default format

      const index = state.document.catalog.characterFormats.findIndex(f => f.tag === tag);
      if (index !== -1) {
        state.document.catalog.characterFormats.splice(index, 1);

        // Remove character tag from all text runs using this format
        for (const page of state.document.pages) {
          for (const frame of page.frames) {
            if (frame.type === 'text') {
              for (const para of (frame as TextFrame).paragraphs) {
                for (const elem of para.content) {
                  if ('characterTag' in elem && elem.characterTag === tag) {
                    elem.characterTag = undefined;
                  }
                }
              }
            }
          }
        }
      }
    }, true);
  }

  toggleBold(): void {
    if (!this.state.cursor || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (para && para.content.length > 0) {
        // Toggle bold on current paragraph's text runs
        for (const elem of para.content) {
          if ('text' in elem) {
            elem.overrides = elem.overrides || {};
            elem.overrides.weight = elem.overrides.weight === 'bold' ? 'normal' : 'bold';
          }
        }
      }
    }, true);
  }

  toggleItalic(): void {
    if (!this.state.cursor || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (para && para.content.length > 0) {
        for (const elem of para.content) {
          if ('text' in elem) {
            elem.overrides = elem.overrides || {};
            elem.overrides.style = elem.overrides.style === 'italic' ? 'normal' : 'italic';
          }
        }
      }
    }, true);
  }

  toggleUnderline(): void {
    if (!this.state.cursor || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (para && para.content.length > 0) {
        for (const elem of para.content) {
          if ('text' in elem) {
            elem.overrides = elem.overrides || {};
            elem.overrides.underline = !elem.overrides.underline;
          }
        }
      }
    }, true);
  }

  applyFontFamily(family: string): void {
    if (!this.state.cursor || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (para && para.content.length > 0) {
        for (const elem of para.content) {
          if ('text' in elem) {
            elem.overrides = elem.overrides || {};
            elem.overrides.family = family;
          }
        }
      }
    }, true);
  }

  applyFontSize(size: number): void {
    if (!this.state.cursor || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (para && para.content.length > 0) {
        for (const elem of para.content) {
          if ('text' in elem) {
            elem.overrides = elem.overrides || {};
            elem.overrides.size = size;
          }
        }
      }
    }, true);
  }

  setAlignment(alignment: 'left' | 'center' | 'right' | 'justified'): void {
    if (!this.state.cursor || !this.state.editingFrameId) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (para) {
        para.overrides = para.overrides || {};
        para.overrides.alignment = alignment;
      }
    }, true);
  }

  // Text replacement for Find/Replace
  replaceTextInDocument(
    findText: string,
    replaceText: string,
    options: { caseSensitive?: boolean; wholeWord?: boolean; frameId?: string } = {}
  ): number {
    if (!findText) return 0;

    let totalReplaced = 0;

    this.update((state) => {
      const framesToProcess = options.frameId
        ? state.document.pages.flatMap((p) => p.frames).filter((f) => f.id === options.frameId)
        : state.document.pages.flatMap((p) => p.frames);

      for (const frame of framesToProcess) {
        if (frame.type === 'text') {
          const textFrame = frame as TextFrame;
          for (const para of textFrame.paragraphs) {
            for (const element of para.content) {
              if ('text' in element && typeof element.text === 'string') {
                const text = element.text;
                const escapedFind = escapeRegex(findText);

                let newText: string;
                let matches: RegExpMatchArray | null;

                if (options.wholeWord) {
                  const flags = options.caseSensitive ? 'g' : 'gi';
                  const regex = new RegExp(`\\b${escapedFind}\\b`, flags);
                  matches = text.match(regex);
                  if (matches) totalReplaced += matches.length;
                  newText = text.replace(regex, replaceText);
                } else if (options.caseSensitive) {
                  const parts = text.split(findText);
                  totalReplaced += parts.length - 1;
                  newText = parts.join(replaceText);
                } else {
                  const regex = new RegExp(escapedFind, 'gi');
                  matches = text.match(regex);
                  if (matches) totalReplaced += matches.length;
                  newText = text.replace(regex, replaceText);
                }

                element.text = newText;
              }
            }
          }
        }
      }
    }, true);

    return totalReplaced;
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

  // Equation insertion
  insertEquation(latex: string, fontSize: number = 12): void {
    if (!this.state.editingFrameId || !this.state.cursor) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (!para) return;

      // Create equation inline element
      const eqElement: EquationInline = {
        type: 'equation',
        id: generateId('eq'),
        latex,
        fontSize,
      };

      // Find the text run at cursor position and insert equation there
      let currentOffset = 0;
      for (let i = 0; i < para.content.length; i++) {
        const elem = para.content[i];
        if ('text' in elem) {
          const runLength = elem.text.length;
          if (currentOffset + runLength >= state.cursor!.offset) {
            // Split text run and insert equation
            const insertPos = state.cursor!.offset - currentOffset;
            const beforeText = elem.text.slice(0, insertPos);
            const afterText = elem.text.slice(insertPos);

            // Replace current element with split elements
            const newElements = [];
            if (beforeText) {
              newElements.push(createTextRun(beforeText));
            }
            newElements.push(eqElement);
            if (afterText) {
              newElements.push(createTextRun(afterText));
            }

            para.content.splice(i, 1, ...newElements);
            state.cursor!.offset += 1; // Equation counts as 1 position
            return;
          }
          currentOffset += runLength;
        }
      }

      // Cursor is at end, append equation
      para.content.push(eqElement);
      state.cursor!.offset += 1;
    }, true);
  }

  // Table insertion
  insertTable(rows: number, cols: number, title: string = ''): void {
    if (!this.state.editingFrameId || !this.state.cursor) return;

    this.update((state) => {
      const frame = this.findFrame(state, state.editingFrameId!) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
      if (!para) return;

      // Create table structure
      const table = createTable(rows, cols);
      if (title) {
        table.title = title;
        table.titlePosition = 'above';
      }

      // Create table inline element
      const tableElement: TableInline = {
        type: 'table',
        id: generateId('tbl'),
        tableData: JSON.stringify(table),
      };

      // Insert table as block element (at end of current paragraph content)
      para.content.push(tableElement);
      state.cursor!.offset += 1;
    }, true);
  }

  // Image frame insertion
  addImageFrame(imageUrl: string, altText: string = '', x?: number, y?: number, width?: number, height?: number): void {
    this.update((state) => {
      const page = state.document.pages[state.currentPageIndex];
      if (!page) return;

      // Default position and size
      const frameX = x ?? 100;
      const frameY = y ?? 100;
      const frameW = width ?? 200;
      const frameH = height ?? 150;

      const imageFrame = createImageFrame(page.id, frameX, frameY, frameW, frameH, imageUrl, altText);
      page.frames.push(imageFrame);

      // Select the new frame
      state.selectedFrameIds = [imageFrame.id];
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

  // Text overflow detection
  updateTextFrameOverflow(frameId: string): void {
    const frame = this.getTextFrame(frameId);
    if (!frame) return;

    const formatMap = createFormatMap(this.state.document.catalog.paragraphFormats);
    const hasOverflow = detectFrameOverflow(frame, formatMap);

    if (frame.overflow !== hasOverflow) {
      this.update((state) => {
        const f = this.findFrame(state, frameId);
        if (f && f.type === 'text') {
          (f as TextFrame).overflow = hasOverflow;
        }
      });
    }
  }

  updateAllTextFrameOverflows(): void {
    this.update((state) => {
      const formatMap = createFormatMap(state.document.catalog.paragraphFormats);
      for (const page of state.document.pages) {
        for (const frame of page.frames) {
          if (frame.type === 'text') {
            const textFrame = frame as TextFrame;
            textFrame.overflow = detectFrameOverflow(textFrame, formatMap);
          }
        }
      }
    });
  }

  // Frame threading (text flow between frames)
  connectFrames(sourceFrameId: string, targetFrameId: string): void {
    this.update((state) => {
      const sourceFrame = this.findFrame(state, sourceFrameId) as TextFrame | null;
      const targetFrame = this.findFrame(state, targetFrameId) as TextFrame | null;

      if (!sourceFrame || sourceFrame.type !== 'text') return;
      if (!targetFrame || targetFrame.type !== 'text') return;

      // Disconnect source's current next connection if any
      if (sourceFrame.nextFrameId) {
        const oldNext = this.findFrame(state, sourceFrame.nextFrameId) as TextFrame | null;
        if (oldNext && oldNext.type === 'text') {
          oldNext.prevFrameId = null;
        }
      }

      // Disconnect target's current prev connection if any
      if (targetFrame.prevFrameId) {
        const oldPrev = this.findFrame(state, targetFrame.prevFrameId) as TextFrame | null;
        if (oldPrev && oldPrev.type === 'text') {
          oldPrev.nextFrameId = null;
        }
      }

      // Create new connection
      sourceFrame.nextFrameId = targetFrameId;
      targetFrame.prevFrameId = sourceFrameId;

      // Update flow tags to match
      if (sourceFrame.flowTag !== targetFrame.flowTag) {
        targetFrame.flowTag = sourceFrame.flowTag;
      }
    }, true);

    // Trigger text reflow
    this.reflowText(sourceFrameId);
  }

  // Reflow text from a frame to its connected frames
  reflowText(frameId: string): void {
    this.update((state) => {
      const frame = this.findFrame(state, frameId) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      // Check if frame has overflow and a next frame
      const formatMap = createFormatMap(state.document.catalog.paragraphFormats);
      const hasOverflow = detectFrameOverflow(frame, formatMap);

      if (hasOverflow && frame.nextFrameId) {
        const nextFrame = this.findFrame(state, frame.nextFrameId) as TextFrame | null;
        if (nextFrame && nextFrame.type === 'text') {
          // Move overflow paragraphs to next frame
          const contentHeight = this.calculateFrameContentHeight(frame, formatMap);
          const availableHeight = frame.height - 12;

          if (contentHeight > availableHeight && frame.paragraphs.length > 1) {
            // Move last paragraph to next frame
            const overflowPara = frame.paragraphs.pop();
            if (overflowPara) {
              nextFrame.paragraphs.unshift(overflowPara);
            }

            // Update overflow flags
            frame.overflow = detectFrameOverflow(frame, formatMap);
            nextFrame.overflow = detectFrameOverflow(nextFrame, formatMap);

            // Recursively reflow if next frame also overflows
            if (nextFrame.overflow && nextFrame.nextFrameId) {
              // Call reflow on next frame (will be processed in next update cycle)
              setTimeout(() => this.reflowText(nextFrame.id), 0);
            }
          }
        }
      }
    });
  }

  private calculateFrameContentHeight(frame: TextFrame, formatMap: Map<string, import('./types').ParagraphProperties>): number {
    let totalHeight = 0;
    const defaultParagraphProperties = {
      firstIndent: 0,
      leftIndent: 0,
      rightIndent: 0,
      spaceAbove: 0,
      spaceBelow: 12,
      lineSpacing: 1.5,
      alignment: 'left' as const,
      tabStops: [],
      defaultFont: {
        family: 'Times New Roman',
        size: 12,
        weight: 'normal' as const,
        style: 'normal' as const,
        color: '#000000',
        underline: false,
        strikethrough: false,
        superscript: false,
        subscript: false,
        tracking: 0,
      },
      keepWithNext: false,
      keepWithPrevious: false,
      widowLines: 2,
      orphanLines: 2,
    };

    for (let i = 0; i < frame.paragraphs.length; i++) {
      const para = frame.paragraphs[i];
      const format = formatMap.get(para.formatTag) || defaultParagraphProperties;
      const props = para.overrides ? { ...format, ...para.overrides } : format;

      const fontSize = props.defaultFont.size;
      const lineHeight = fontSize * props.lineSpacing;

      // Calculate total text length
      let totalChars = 0;
      for (const elem of para.content) {
        if ('text' in elem) {
          totalChars += elem.text.length;
        }
      }

      // Estimate number of lines
      const availableWidth = frame.width - props.leftIndent - props.rightIndent - 12;
      const avgCharWidth = fontSize * 0.5;
      const charsPerLine = Math.floor(availableWidth / avgCharWidth);
      const estimatedLines = Math.max(1, Math.ceil(totalChars / charsPerLine));

      const contentHeight = estimatedLines * lineHeight;
      totalHeight += props.spaceAbove + contentHeight + props.spaceBelow;
    }

    return totalHeight;
  }

  disconnectFrame(frameId: string): void {
    this.update((state) => {
      const frame = this.findFrame(state, frameId) as TextFrame | null;
      if (!frame || frame.type !== 'text') return;

      // Disconnect from previous frame
      if (frame.prevFrameId) {
        const prevFrame = this.findFrame(state, frame.prevFrameId) as TextFrame | null;
        if (prevFrame && prevFrame.type === 'text') {
          prevFrame.nextFrameId = frame.nextFrameId;
        }
      }

      // Disconnect from next frame
      if (frame.nextFrameId) {
        const nextFrame = this.findFrame(state, frame.nextFrameId) as TextFrame | null;
        if (nextFrame && nextFrame.type === 'text') {
          nextFrame.prevFrameId = frame.prevFrameId;
        }
      }

      frame.prevFrameId = null;
      frame.nextFrameId = null;
    }, true);
  }

  autoconnectFrames(): void {
    this.update((state) => {
      // Find all text frames in document order
      const allTextFrames: TextFrame[] = [];
      for (const page of state.document.pages) {
        for (const frame of page.frames) {
          if (frame.type === 'text') {
            allTextFrames.push(frame as TextFrame);
          }
        }
      }

      // Connect frames with matching flow tags that have overflow
      for (let i = 0; i < allTextFrames.length - 1; i++) {
        const currentFrame = allTextFrames[i];
        if (currentFrame.overflow && !currentFrame.nextFrameId) {
          // Find next empty frame with matching flow tag
          for (let j = i + 1; j < allTextFrames.length; j++) {
            const nextFrame = allTextFrames[j];
            if (
              nextFrame.flowTag === currentFrame.flowTag &&
              !nextFrame.prevFrameId &&
              nextFrame.paragraphs.length === 0
            ) {
              currentFrame.nextFrameId = nextFrame.id;
              nextFrame.prevFrameId = currentFrame.id;
              break;
            }
          }
        }
      }
    }, true);
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
