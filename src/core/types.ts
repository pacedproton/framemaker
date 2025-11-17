// Core Frame-Based Document Model
// Everything in FrameMaker is a Frame

export type FrameType = 'text' | 'math' | 'graphic' | 'table';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Base Frame - the atomic unit of FrameMaker
export interface Frame {
  id: string;
  type: FrameType;
  pageId: string;

  // Geometry
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees

  // Frame properties
  margins: Margins;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
  opacity: number;

  // Layer ordering
  zIndex: number;
  locked: boolean;
  visible: boolean;

  // Anchoring
  anchorType: 'page' | 'frame' | 'text';
  anchorId?: string;
  anchorOffset?: Point;
}

// Text Frame - contains flowing text
export interface TextFrame extends Frame {
  type: 'text';

  // Text content
  content: TextRun[];

  // Text frame properties
  columns: number;
  columnGap: number;
  verticalAlign: 'top' | 'center' | 'bottom';

  // Text flow chain
  nextFrameId?: string;
  prevFrameId?: string;

  // Overflow indicator
  hasOverflow: boolean;
}

// Text content model
export interface TextRun {
  id: string;
  text: string;
  style: TextStyle;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number; // in points
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'strikethrough';
  color: string;
  backgroundColor?: string;
  superscript?: boolean;
  subscript?: boolean;
}

export interface ParagraphStyle {
  id: string;
  name: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number; // multiplier
  spaceBefore: number; // points
  spaceAfter: number; // points
  firstLineIndent: number; // points
  leftIndent: number;
  rightIndent: number;
  textStyle: TextStyle;
}

// Math Frame - contains mathematical equations
export interface MathFrame extends Frame {
  type: 'math';

  // LaTeX source
  latex: string;

  // Display options
  displayMode: boolean; // block vs inline
  fontSize: number;
  color: string;
}

// Graphic Frame - contains images
export interface GraphicFrame extends Frame {
  type: 'graphic';

  // Image content
  imageUrl?: string;
  imageData?: string; // base64

  // Fitting
  fitMode: 'fill' | 'fit' | 'stretch' | 'tile' | 'none';
  imagePosition: Point; // offset within frame
  imageScale: number;

  // Alt text
  altText: string;
}

// Table Frame - contains structured table data
export interface TableFrame extends Frame {
  type: 'table';

  // Table structure
  rows: number;
  cols: number;
  cells: TableCell[][];

  // Column widths (in points)
  columnWidths: number[];
  rowHeights: number[];

  // Table styling
  borderCollapse: boolean;
  cellPadding: number;
  headerRows: number;
}

export interface TableCell {
  content: TextRun[];
  rowSpan: number;
  colSpan: number;
  backgroundColor: string;
  borderTop: CellBorder;
  borderRight: CellBorder;
  borderBottom: CellBorder;
  borderLeft: CellBorder;
  verticalAlign: 'top' | 'center' | 'bottom';
}

export interface CellBorder {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
}

// Page - container for frames
export interface Page {
  id: string;
  pageNumber: number;

  // Page size (in points, 72 points = 1 inch)
  width: number;
  height: number;

  // Page margins
  margins: Margins;

  // Frames on this page
  frames: (TextFrame | MathFrame | GraphicFrame | TableFrame)[];

  // Master page reference
  masterPageId?: string;

  // Page properties
  orientation: 'portrait' | 'landscape';
  bleed: number;
}

// Master Page - template for regular pages
export interface MasterPage {
  id: string;
  name: string;

  // Template frames (headers, footers, etc.)
  templateFrames: Frame[];

  // Page size
  width: number;
  height: number;
  margins: Margins;
}

// Document - the root container
export interface Document {
  id: string;
  name: string;

  // Pages
  pages: Page[];

  // Master pages
  masterPages: MasterPage[];

  // Document-wide styles
  paragraphStyles: ParagraphStyle[];

  // Variables (for headers, footers, etc.)
  variables: Record<string, string>;

  // Metadata
  author: string;
  created: Date;
  modified: Date;
}

// Editor state
export interface EditorState {
  document: Document;
  currentPageIndex: number;
  selectedFrameId: string | null;

  // Tool state
  activeTool: Tool;

  // View state
  zoom: number;
  showGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  showMargins: boolean;
  showFrameBorders: boolean;

  // Clipboard
  clipboard: Frame | null;
}

export type Tool =
  | 'select'
  | 'text-frame'
  | 'math-frame'
  | 'graphic-frame'
  | 'table-frame'
  | 'pan'
  | 'zoom';

// Factory functions
export function createTextFrame(
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number
): TextFrame {
  return {
    id: generateId(),
    type: 'text',
    pageId,
    x,
    y,
    width,
    height,
    rotation: 0,
    margins: { top: 6, right: 6, bottom: 6, left: 6 },
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    anchorType: 'page',
    content: [],
    columns: 1,
    columnGap: 12,
    verticalAlign: 'top',
    hasOverflow: false,
  };
}

export function createMathFrame(
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number
): MathFrame {
  return {
    id: generateId(),
    type: 'math',
    pageId,
    x,
    y,
    width,
    height,
    rotation: 0,
    margins: { top: 6, right: 6, bottom: 6, left: 6 },
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    anchorType: 'page',
    latex: '',
    displayMode: true,
    fontSize: 14,
    color: '#000000',
  };
}

export function createGraphicFrame(
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number
): GraphicFrame {
  return {
    id: generateId(),
    type: 'graphic',
    pageId,
    x,
    y,
    width,
    height,
    rotation: 0,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#f0f0f0',
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    anchorType: 'page',
    fitMode: 'fit',
    imagePosition: { x: 0, y: 0 },
    imageScale: 1,
    altText: '',
  };
}

export function createTableFrame(
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rows: number = 3,
  cols: number = 3
): TableFrame {
  const cellWidth = (width - 12) / cols;
  const cellHeight = (height - 12) / rows;

  const cells: TableCell[][] = [];
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = {
        content: [],
        rowSpan: 1,
        colSpan: 1,
        backgroundColor: '#ffffff',
        borderTop: { width: 1, color: '#000000', style: 'solid' },
        borderRight: { width: 1, color: '#000000', style: 'solid' },
        borderBottom: { width: 1, color: '#000000', style: 'solid' },
        borderLeft: { width: 1, color: '#000000', style: 'solid' },
        verticalAlign: 'top',
      };
    }
  }

  return {
    id: generateId(),
    type: 'table',
    pageId,
    x,
    y,
    width,
    height,
    rotation: 0,
    margins: { top: 6, right: 6, bottom: 6, left: 6 },
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    anchorType: 'page',
    rows,
    cols,
    cells,
    columnWidths: Array(cols).fill(cellWidth),
    rowHeights: Array(rows).fill(cellHeight),
    borderCollapse: true,
    cellPadding: 4,
    headerRows: 1,
  };
}

export function createPage(pageNumber: number): Page {
  return {
    id: generateId(),
    pageNumber,
    // US Letter size in points (72 points = 1 inch)
    width: 612, // 8.5 inches
    height: 792, // 11 inches
    margins: { top: 72, right: 72, bottom: 72, left: 72 },
    frames: [],
    orientation: 'portrait',
    bleed: 0,
  };
}

export function createDocument(name: string): Document {
  const firstPage = createPage(1);

  return {
    id: generateId(),
    name,
    pages: [firstPage],
    masterPages: [],
    paragraphStyles: [
      {
        id: generateId(),
        name: 'Body',
        alignment: 'justify',
        lineHeight: 1.5,
        spaceBefore: 0,
        spaceAfter: 12,
        firstLineIndent: 0,
        leftIndent: 0,
        rightIndent: 0,
        textStyle: {
          fontFamily: 'Times New Roman',
          fontSize: 12,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#000000',
        },
      },
      {
        id: generateId(),
        name: 'Heading 1',
        alignment: 'left',
        lineHeight: 1.2,
        spaceBefore: 24,
        spaceAfter: 12,
        firstLineIndent: 0,
        leftIndent: 0,
        rightIndent: 0,
        textStyle: {
          fontFamily: 'Arial',
          fontSize: 24,
          fontWeight: 'bold',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#000000',
        },
      },
    ],
    variables: {
      'DocumentTitle': name,
      'Author': '',
      'Date': new Date().toLocaleDateString(),
      'PageNumber': '1',
    },
    author: '',
    created: new Date(),
    modified: new Date(),
  };
}

// ID generator
let idCounter = 0;
function generateId(): string {
  return `frame_${Date.now()}_${idCounter++}`;
}
