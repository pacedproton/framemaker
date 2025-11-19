// Factory functions for creating document objects
import type {
  FMDocument,
  Page,
  TextFrame,
  ImageFrame,
  GraphicFrame,
  GraphicObjectType,
  Paragraph,
  TextRun,
  ParagraphFormat,
  CharacterFormat,
  Flow,
} from './types';
import {
  generateId,
  defaultParagraphProperties,
  defaultCharacterProperties,
} from './types';

export function createTextRun(text: string, characterTag?: string): TextRun {
  return {
    id: generateId('run'),
    text,
    characterTag,
  };
}

export function createParagraph(
  text: string = '',
  formatTag: string = 'Body'
): Paragraph {
  return {
    id: generateId('para'),
    formatTag,
    content: text ? [createTextRun(text)] : [],
  };
}

export function createTextFrame(
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  flowTag: string = 'A'
): TextFrame {
  return {
    id: generateId('frame'),
    type: 'text',
    pageId,
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 0,
    locked: false,
    visible: true,
    strokeWidth: 1,
    strokeColor: '#000000',
    fillColor: '#ffffff',
    runaround: { type: 'none', gap: 12 },
    flowTag,
    columns: 1,
    columnGap: 12,
    paragraphs: [createParagraph()],
    nextFrameId: null,
    prevFrameId: null,
    overflow: false,
  };
}

export function createImageFrame(
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  imageUrl: string = '',
  altText: string = ''
): ImageFrame {
  return {
    id: generateId('img'),
    type: 'image',
    pageId,
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    strokeWidth: 1,
    strokeColor: '#000000',
    fillColor: '#ffffff',
    runaround: { type: 'bothSides', gap: 12 },
    imageUrl,
    altText,
    objectFit: 'contain',
    opacity: 1,
  };
}

export function createGraphicFrame(
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  graphicType: GraphicObjectType
): GraphicFrame {
  return {
    id: generateId('graphic'),
    type: 'graphic',
    pageId,
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    strokeWidth: 1,
    strokeColor: '#000000',
    fillColor: 'transparent',
    runaround: { type: 'bothSides', gap: 12 },
    graphicType,
    lineStyle: 'solid',
    lineWidth: 1,
    arrowStart: false,
    arrowEnd: false,
    cornerRadius: 0,
  };
}

export function createPage(number: number): Page {
  const pageId = generateId('page');
  // US Letter: 8.5" x 11" = 612pt x 792pt
  const pageWidth = 612;
  const pageHeight = 792;
  const marginTop = 72;
  const marginBottom = 72;
  const marginLeft = 72;
  const marginRight = 72;

  // Create default text frame filling the text area
  const textFrame = createTextFrame(
    pageId,
    marginLeft,
    marginTop,
    pageWidth - marginLeft - marginRight,
    pageHeight - marginTop - marginBottom,
    'A'
  );

  // Add sample content so the frame is visible
  textFrame.paragraphs = [
    createParagraph('Click here to start typing. This is a text frame that you can drag, resize, and edit.', 'Body'),
  ];

  return {
    id: pageId,
    number,
    masterPageId: null,
    frames: [textFrame],
  };
}

export function createFlow(tag: string = 'A'): Flow {
  return {
    id: generateId('flow'),
    tag,
    autoconnect: true,
    frameIds: [],
  };
}

export function createDefaultParagraphFormats(): ParagraphFormat[] {
  return [
    {
      tag: 'Body',
      properties: {
        ...defaultParagraphProperties,
        alignment: 'justified',
        firstIndent: 18, // 0.25 inch
      },
    },
    {
      tag: 'Heading1',
      properties: {
        ...defaultParagraphProperties,
        spaceAbove: 24,
        spaceBelow: 12,
        lineSpacing: 1.2,
        defaultFont: {
          ...defaultCharacterProperties,
          family: 'Helvetica',
          size: 24,
          weight: 'bold',
        },
      },
    },
    {
      tag: 'Heading2',
      properties: {
        ...defaultParagraphProperties,
        spaceAbove: 18,
        spaceBelow: 10,
        lineSpacing: 1.2,
        defaultFont: {
          ...defaultCharacterProperties,
          family: 'Helvetica',
          size: 18,
          weight: 'bold',
        },
      },
    },
    {
      tag: 'Heading3',
      properties: {
        ...defaultParagraphProperties,
        spaceAbove: 12,
        spaceBelow: 8,
        lineSpacing: 1.2,
        defaultFont: {
          ...defaultCharacterProperties,
          family: 'Helvetica',
          size: 14,
          weight: 'bold',
        },
      },
    },
  ];
}

export function createDefaultCharacterFormats(): CharacterFormat[] {
  return [
    {
      tag: 'Emphasis',
      properties: {
        style: 'italic',
      },
    },
    {
      tag: 'Strong',
      properties: {
        weight: 'bold',
      },
    },
    {
      tag: 'Code',
      properties: {
        family: 'Courier New',
      },
    },
  ];
}

export function createDefaultVariables(): import('./types').VariableDefinition[] {
  return [
    {
      name: 'Current Page #',
      type: 'currentPageNumber',
      format: 'numeric',
    },
    {
      name: 'Page Count',
      type: 'pageCount',
      format: 'numeric',
    },
    {
      name: 'Creation Date',
      type: 'creationDate',
      format: 'MM/DD/YYYY',
    },
    {
      name: 'Modification Date',
      type: 'modificationDate',
      format: 'MM/DD/YYYY',
    },
    {
      name: 'Filename',
      type: 'filename',
    },
    {
      name: 'Author',
      type: 'author',
    },
    {
      name: 'Running H/F 1',
      type: 'runningHeader',
    },
    {
      name: 'Running H/F 2',
      type: 'runningFooter',
    },
  ];
}

export function createDocument(name: string = 'Untitled'): FMDocument {
  const doc: FMDocument = {
    id: generateId('doc'),
    name,

    metadata: {
      author: '',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },

    settings: {
      units: 'in',
      snapToGrid: true,
      gridSpacing: 18, // 0.25 inch
      showRulers: true,
      showGuides: true,
      showTextSymbols: false,
    },

    pageSize: {
      width: 612, // 8.5 inches
      height: 792, // 11 inches
    },

    margins: {
      top: 72, // 1 inch
      bottom: 72,
      left: 72,
      right: 72,
    },

    columnSetup: {
      count: 1,
      gap: 18,
    },

    pages: [createPage(1)],
    masterPages: [],
    flows: [createFlow('A')],

    catalog: {
      paragraphFormats: createDefaultParagraphFormats(),
      characterFormats: createDefaultCharacterFormats(),
    },

    variables: createDefaultVariables(),
  };

  // Register frame in flow
  const firstFrame = doc.pages[0].frames[0];
  if (firstFrame.type === 'text') {
    doc.flows[0].frameIds.push(firstFrame.id);
  }

  return doc;
}

export function createInitialEditorState(): EditorState {
  return {
    document: createDocument('Untitled Document'),
    currentPageIndex: 0,
    selectedFrameIds: [],
    activeTool: 'text',
    editingFrameId: null,
    cursor: null,
    selection: null,
    zoom: 100,
    showGrid: false,
    showMargins: true,
    showFrameBorders: true,
  };
}

// Import EditorState type
import type { EditorState } from './types';
