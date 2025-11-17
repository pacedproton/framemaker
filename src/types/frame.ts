import { v4 as uuidv4 } from 'uuid';

export interface Frame {
  id: string;
  type: 'text' | 'graphic' | 'table' | 'unanchored';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  name: string;
  // For text frames
  content?: string;
  columns?: number;
  columnGap?: number;
  textInset?: { top: number; bottom: number; left: number; right: number };
  nextFrameId?: string; // For text flow
  prevFrameId?: string;
  overflow?: boolean;
  // For graphic frames
  imageUrl?: string;
  imageFit?: 'fill' | 'fit' | 'stretch' | 'tile';
  // Styling
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  opacity?: number;
  // Anchoring
  anchorType?: 'page' | 'paragraph' | 'character';
  anchorPosition?: 'inline' | 'top' | 'bottom' | 'left' | 'right';
}

export interface Page {
  id: string;
  pageNumber: number;
  masterPageId?: string;
  frames: Frame[];
  width: number;
  height: number;
}

export const createTextFrame = (
  x: number = 100,
  y: number = 100,
  width: number = 400,
  height: number = 300
): Frame => ({
  id: uuidv4(),
  type: 'text',
  x,
  y,
  width,
  height,
  rotation: 0,
  zIndex: 1,
  locked: false,
  visible: true,
  name: 'Text Frame',
  content: '',
  columns: 1,
  columnGap: 12,
  textInset: { top: 6, bottom: 6, left: 6, right: 6 },
  overflow: false,
  backgroundColor: 'transparent',
  borderColor: '#000000',
  borderWidth: 1,
  borderStyle: 'solid',
  opacity: 1,
});

export const createGraphicFrame = (
  x: number = 100,
  y: number = 100,
  width: number = 300,
  height: number = 200
): Frame => ({
  id: uuidv4(),
  type: 'graphic',
  x,
  y,
  width,
  height,
  rotation: 0,
  zIndex: 1,
  locked: false,
  visible: true,
  name: 'Graphic Frame',
  imageUrl: '',
  imageFit: 'fit',
  backgroundColor: '#f0f0f0',
  borderColor: '#000000',
  borderWidth: 1,
  borderStyle: 'solid',
  opacity: 1,
});

export const createUnanchoredFrame = (
  x: number = 100,
  y: number = 100,
  width: number = 200,
  height: number = 150
): Frame => ({
  id: uuidv4(),
  type: 'unanchored',
  x,
  y,
  width,
  height,
  rotation: 0,
  zIndex: 10,
  locked: false,
  visible: true,
  name: 'Unanchored Frame',
  content: '',
  backgroundColor: '#ffffff',
  borderColor: '#0066cc',
  borderWidth: 2,
  borderStyle: 'solid',
  opacity: 1,
});
