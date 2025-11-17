// Core document types for FrameMaker clone
import type { BaseEditor, Descendant } from 'slate';
import type { ReactEditor } from 'slate-react';
import type { HistoryEditor } from 'slate-history';

// Custom Slate types
export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

export type ParagraphElement = {
  type: 'paragraph';
  styleId?: string;
  children: CustomText[];
};

export type HeadingElement = {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  styleId?: string;
  id: string;
  children: CustomText[];
};

export type TableElement = {
  type: 'table';
  id: string;
  rows: number;
  cols: number;
  children: TableRowElement[];
};

export type TableRowElement = {
  type: 'table-row';
  children: TableCellElement[];
};

export type TableCellElement = {
  type: 'table-cell';
  rowSpan?: number;
  colSpan?: number;
  children: Descendant[];
};

export type ImageElement = {
  type: 'image';
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: string;
  children: CustomText[];
};

export type AnchoredFrameElement = {
  type: 'anchored-frame';
  id: string;
  position: 'inline' | 'top' | 'bottom' | 'left' | 'right';
  width: number;
  height: number;
  children: Descendant[];
};

export type CrossReferenceElement = {
  type: 'cross-reference';
  targetId: string;
  format: 'page' | 'title' | 'number' | 'full';
  children: CustomText[];
};

export type VariableElement = {
  type: 'variable';
  name: string;
  children: CustomText[];
};

export type IndexMarkerElement = {
  type: 'index-marker';
  terms: string[];
  children: CustomText[];
};

export type ConditionalTextElement = {
  type: 'conditional-text';
  conditions: string[];
  children: Descendant[];
};

export type ListElement = {
  type: 'bulleted-list' | 'numbered-list';
  children: ListItemElement[];
};

export type ListItemElement = {
  type: 'list-item';
  children: Descendant[];
};

export type BlockQuoteElement = {
  type: 'block-quote';
  children: Descendant[];
};

export type CodeBlockElement = {
  type: 'code-block';
  language?: string;
  children: CustomText[];
};

export type CustomElement =
  | ParagraphElement
  | HeadingElement
  | TableElement
  | TableRowElement
  | TableCellElement
  | ImageElement
  | AnchoredFrameElement
  | CrossReferenceElement
  | VariableElement
  | IndexMarkerElement
  | ConditionalTextElement
  | ListElement
  | ListItemElement
  | BlockQuoteElement
  | CodeBlockElement;

export type FormattedText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  superscript?: boolean;
  subscript?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  characterStyleId?: string;
};

export type CustomText = FormattedText;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Paragraph Style
export interface ParagraphStyle {
  id: string;
  name: string;
  basedOn?: string;
  nextStyle?: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  firstLineIndent: number;
  keepWithNext: boolean;
  keepTogether: boolean;
  pageBreakBefore: boolean;
  outlineLevel?: number;
}

// Character Style
export interface CharacterStyle {
  id: string;
  name: string;
  basedOn?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  color?: string;
  backgroundColor?: string;
}

// Master Page
export interface MasterPage {
  id: string;
  name: string;
  pageSize: {
    width: number;
    height: number;
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  columns: number;
  columnGap: number;
  headerContent: Descendant[];
  footerContent: Descendant[];
  backgroundElements: BackgroundElement[];
}

export interface BackgroundElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style?: Record<string, string | number>;
}

// Document Structure
export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  pageNumber?: number;
  children: DocumentSection[];
}

// Variable Definition
export interface VariableDefinition {
  name: string;
  value: string;
  type: 'text' | 'date' | 'page' | 'custom';
}

// Condition Tag
export interface ConditionTag {
  name: string;
  color: string;
  visible: boolean;
}

// Index Entry
export interface IndexEntry {
  id: string;
  terms: string[];
  pageNumber: number;
  sortKey: string;
}

// Book Document (for multi-document books)
export interface BookDocument {
  id: string;
  name: string;
  path: string;
  type: 'chapter' | 'appendix' | 'frontmatter' | 'backmatter';
  order: number;
  included: boolean;
}

// Main Document
export interface FrameMakerDocument {
  id: string;
  name: string;
  created: Date;
  modified: Date;
  content: Descendant[];
  paragraphStyles: ParagraphStyle[];
  characterStyles: CharacterStyle[];
  masterPages: MasterPage[];
  variables: VariableDefinition[];
  conditions: ConditionTag[];
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  language: string;
  version: string;
}

// Book (collection of documents)
export interface Book {
  id: string;
  name: string;
  documents: BookDocument[];
  variables: VariableDefinition[];
  numberingStyle: NumberingStyle;
}

export interface NumberingStyle {
  chapterPrefix: string;
  chapterSuffix: string;
  sectionSeparator: string;
  pageNumbering: 'continuous' | 'perChapter';
  startPage: number;
}

// Find/Replace
export interface FindReplaceOptions {
  searchText: string;
  replaceText: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  searchIn: 'document' | 'book' | 'selection';
  includeStyles: boolean;
  includeConditions: boolean;
}

// Export Options
export interface PDFExportOptions {
  pageSize: string;
  orientation: 'portrait' | 'landscape';
  includeBookmarks: boolean;
  includeTOC: boolean;
  includeIndex: boolean;
  embedFonts: boolean;
  imageQuality: 'low' | 'medium' | 'high';
}

export interface HTMLExportOptions {
  singleFile: boolean;
  includeCSS: boolean;
  includeImages: boolean;
  responsiveDesign: boolean;
}

// DITA Support
export interface DITAElement {
  type: 'topic' | 'concept' | 'task' | 'reference';
  id: string;
  title: string;
  shortDesc?: string;
  content: Descendant[];
  metadata: DITAMetadata;
}

export interface DITAMetadata {
  audience?: string;
  platform?: string;
  product?: string;
  otherprops?: Record<string, string>;
}

// Undo/Redo
export interface HistoryState {
  past: Descendant[][];
  present: Descendant[];
  future: Descendant[][];
}
