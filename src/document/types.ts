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

// Variable types
export type VariableType =
  | 'currentPageNumber'
  | 'pageCount'
  | 'chapterNumber'
  | 'chapterTitle'
  | 'runningHeader'
  | 'runningFooter'
  | 'creationDate'
  | 'modificationDate'
  | 'filename'
  | 'author'
  | 'custom';

// Variable definition
export interface VariableDefinition {
  name: string;
  type: VariableType;
  format?: string; // For date formatting, number formatting, etc.
  customValue?: string; // For custom variables
}

// Variable inline element (reference to a variable)
export interface VariableInline {
  type: 'variable';
  id: string;
  variableName: string;
}

// Inline element
export type InlineElement = TextRun | AnchorMarker | EquationInline | TableInline | VariableInline;

// Paragraph
export interface Paragraph {
  id: string;
  formatTag: string;
  content: InlineElement[];
  overrides?: Partial<ParagraphProperties>;
}

// Frame types
export type FrameType = 'text' | 'anchored' | 'unanchored' | 'image' | 'graphic';

// Runaround types
export type RunaroundType = 'none' | 'bothSides' | 'leftSide' | 'rightSide' | 'runInto';

// Runaround properties
export interface RunaroundProperties {
  type: RunaroundType;
  gap: number; // Gap between text and frame in points
}

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
  runaround: RunaroundProperties;
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

// Image frame (for displaying images)
export interface ImageFrame extends BaseFrame {
  type: 'image';
  imageUrl: string;
  altText: string;
  objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  opacity: number;
}

// Graphic object types
export type GraphicObjectType = 'line' | 'rectangle' | 'ellipse' | 'polygon' | 'polyline';

// Graphic frame (for vector graphics)
export interface GraphicFrame extends BaseFrame {
  type: 'graphic';
  graphicType: GraphicObjectType;
  points?: { x: number; y: number }[]; // For polygon/polyline
  lineStyle: 'solid' | 'dashed' | 'dotted';
  lineWidth: number;
  arrowStart: boolean;
  arrowEnd: boolean;
  cornerRadius: number; // For rounded rectangles
}

export type Frame = TextFrame | AnchoredFrame | UnanchoredFrame | ImageFrame | GraphicFrame;

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

  variables: VariableDefinition[];
}

// Editor state
export interface EditorState {
  document: FMDocument;
  currentPageIndex: number;
  selectedFrameIds: string[];
  activeTool: 'select' | 'text' | 'textFrame' | 'pan' | 'line' | 'rectangle' | 'ellipse';

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
