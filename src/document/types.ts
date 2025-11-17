// Core types for FrameMaker Web Clone
// Based on SPECIFICATION.md

// Base units: all measurements in points (72pt = 1 inch)

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Character properties
export interface CharacterProperties {
  family: string;
  size: number;
  weight: 'normal' | 'bold';
  style: 'normal' | 'italic';
  color: string;
  underline: boolean;
  strikethrough: boolean;
  superscript: boolean;
  subscript: boolean;
  tracking: number;
}

// Tab stop
export interface TabStop {
  position: number;
  alignment: 'left' | 'center' | 'right' | 'decimal';
  leader: string;
}

// Paragraph properties
export interface ParagraphProperties {
  firstIndent: number;
  leftIndent: number;
  rightIndent: number;
  spaceAbove: number;
  spaceBelow: number;
  lineSpacing: number; // multiplier (1.0, 1.5, 2.0)
  alignment: 'left' | 'center' | 'right' | 'justified';
  tabStops: TabStop[];
  defaultFont: CharacterProperties;
  keepWithNext: boolean;
  keepWithPrevious: boolean;
  widowLines: number;
  orphanLines: number;
}

// Paragraph format (catalog entry)
export interface ParagraphFormat {
  tag: string;
  properties: ParagraphProperties;
}

// Character format (catalog entry)
export interface CharacterFormat {
  tag: string;
  properties: Partial<CharacterProperties>;
}

// Text run - inline text with formatting
export interface TextRun {
  id: string;
  text: string;
  characterTag?: string;
  overrides?: Partial<CharacterProperties>;
}

// Anchor marker - points to anchored frame
export interface AnchorMarker {
  type: 'anchor';
  frameId: string;
}

// Equation inline element
export interface EquationInline {
  type: 'equation';
  id: string;
  latex: string;
  fontSize: number;
}

// Table inline element (embedded table in text flow)
export interface TableInline {
  type: 'table';
  id: string;
  tableData: string; // JSON serialized table structure
}

// Inline element
export type InlineElement = TextRun | AnchorMarker | EquationInline | TableInline;

// Paragraph
export interface Paragraph {
  id: string;
  formatTag: string;
  content: InlineElement[];
  overrides?: Partial<ParagraphProperties>;
}

// Frame types
export type FrameType = 'text' | 'anchored' | 'unanchored';

// Base frame
export interface BaseFrame {
  id: string;
  type: FrameType;
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  strokeWidth: number;
  strokeColor: string;
  fillColor: string;
}

// Text frame
export interface TextFrame extends BaseFrame {
  type: 'text';
  flowTag: string;
  columns: number;
  columnGap: number;
  paragraphs: Paragraph[];
  nextFrameId: string | null;
  prevFrameId: string | null;
  overflow: boolean;
}

// Anchored frame position types
export type AnchorPosition =
  | 'inline'
  | 'below'
  | 'topOfColumn'
  | 'bottomOfColumn'
  | 'runInto'
  | 'outsideColumn';

// Anchored frame
export interface AnchoredFrame extends BaseFrame {
  type: 'anchored';
  anchorParagraphId: string;
  anchorCharOffset: number;
  anchorPosition: AnchorPosition;
  alignment: 'left' | 'center' | 'right';
  cropped: boolean;
  floating: boolean;
  runaroundGap: number;
  content: string; // For now, simple content
}

// Unanchored frame
export interface UnanchoredFrame extends BaseFrame {
  type: 'unanchored';
  runaroundGap: number;
  content: string;
}

export type Frame = TextFrame | AnchoredFrame | UnanchoredFrame;

// Page
export interface Page {
  id: string;
  number: number;
  masterPageId: string | null;
  frames: Frame[];
}

// Master page
export interface MasterPage {
  id: string;
  name: string;
  pageType: 'left' | 'right' | 'single';
  templateFrames: TextFrame[];
  backgroundFrames: Frame[];
}

// Flow (text threading)
export interface Flow {
  id: string;
  tag: string;
  autoconnect: boolean;
  frameIds: string[];
}

// Document
export interface FMDocument {
  id: string;
  name: string;

  metadata: {
    author: string;
    createdAt: number;
    modifiedAt: number;
  };

  settings: {
    units: 'in' | 'pt' | 'cm';
    snapToGrid: boolean;
    gridSpacing: number;
    showRulers: boolean;
    showGuides: boolean;
    showTextSymbols: boolean;
  };

  pageSize: {
    width: number;
    height: number;
  };

  margins: Margins;

  columnSetup: {
    count: number;
    gap: number;
  };

  pages: Page[];
  masterPages: MasterPage[];
  flows: Flow[];

  catalog: {
    paragraphFormats: ParagraphFormat[];
    characterFormats: CharacterFormat[];
  };
}

// Editor state
export interface EditorState {
  document: FMDocument;
  currentPageIndex: number;
  selectedFrameIds: string[];
  activeTool: 'select' | 'text' | 'textFrame' | 'pan';

  // Text editing state
  editingFrameId: string | null;
  cursor: {
    paragraphId: string;
    offset: number;
  } | null;
  selection: {
    startParagraphId: string;
    startOffset: number;
    endParagraphId: string;
    endOffset: number;
  } | null;

  // View state
  zoom: number;
  showGrid: boolean;
  showMargins: boolean;
  showFrameBorders: boolean;
}

// ID generator
let idCounter = 0;
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${idCounter++}`;
}

// Default character properties
export const defaultCharacterProperties: CharacterProperties = {
  family: 'Times New Roman',
  size: 12,
  weight: 'normal',
  style: 'normal',
  color: '#000000',
  underline: false,
  strikethrough: false,
  superscript: false,
  subscript: false,
  tracking: 0,
};

// Default paragraph properties
export const defaultParagraphProperties: ParagraphProperties = {
  firstIndent: 0,
  leftIndent: 0,
  rightIndent: 0,
  spaceAbove: 0,
  spaceBelow: 12,
  lineSpacing: 1.5,
  alignment: 'left',
  tabStops: [],
  defaultFont: { ...defaultCharacterProperties },
  keepWithNext: false,
  keepWithPrevious: false,
  widowLines: 2,
  orphanLines: 2,
};
