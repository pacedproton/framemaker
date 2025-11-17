import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Descendant } from 'slate';
import { v4 as uuidv4 } from 'uuid';
import type {
  FrameMakerDocument,
  ParagraphStyle,
  CharacterStyle,
  MasterPage,
  VariableDefinition,
  ConditionTag,
  Book,
  BookDocument,
  DocumentSection,
  IndexEntry,
  FindReplaceOptions,
} from '../types/document';

interface DocumentState {
  // Current document
  currentDocument: FrameMakerDocument | null;

  // Book management
  currentBook: Book | null;

  // UI State
  activePanel: 'structure' | 'styles' | 'variables' | 'conditions' | 'index' | 'properties';
  showFindReplace: boolean;
  showExportDialog: boolean;
  showInsertTableDialog: boolean;
  showInsertImageDialog: boolean;
  showStyleEditor: boolean;
  showMasterPageEditor: boolean;

  // Editor state
  selectedElement: string | null;
  zoom: number;
  viewMode: 'normal' | 'preview' | 'structure';

  // Document structure (TOC)
  documentStructure: DocumentSection[];

  // Index entries
  indexEntries: IndexEntry[];

  // Undo/Redo
  history: Descendant[][];
  historyIndex: number;

  // Find/Replace
  findReplaceOptions: FindReplaceOptions;
  searchResults: { path: number[]; offset: number }[];
  currentSearchIndex: number;

  // Actions
  createNewDocument: () => void;
  loadDocument: (doc: FrameMakerDocument) => void;
  saveDocument: () => FrameMakerDocument | null;
  updateContent: (content: Descendant[]) => void;

  // Style actions
  addParagraphStyle: (style: ParagraphStyle) => void;
  updateParagraphStyle: (id: string, style: Partial<ParagraphStyle>) => void;
  deleteParagraphStyle: (id: string) => void;
  addCharacterStyle: (style: CharacterStyle) => void;
  updateCharacterStyle: (id: string, style: Partial<CharacterStyle>) => void;
  deleteCharacterStyle: (id: string) => void;

  // Master page actions
  addMasterPage: (page: MasterPage) => void;
  updateMasterPage: (id: string, page: Partial<MasterPage>) => void;
  deleteMasterPage: (id: string) => void;

  // Variable actions
  addVariable: (variable: VariableDefinition) => void;
  updateVariable: (name: string, value: string) => void;
  deleteVariable: (name: string) => void;

  // Condition actions
  addCondition: (condition: ConditionTag) => void;
  updateCondition: (name: string, condition: Partial<ConditionTag>) => void;
  deleteCondition: (name: string) => void;
  toggleConditionVisibility: (name: string) => void;

  // Book actions
  createNewBook: () => void;
  addDocumentToBook: (doc: BookDocument) => void;
  removeDocumentFromBook: (id: string) => void;
  reorderBookDocuments: (fromIndex: number, toIndex: number) => void;

  // Structure actions
  updateDocumentStructure: () => void;

  // Index actions
  addIndexEntry: (entry: IndexEntry) => void;
  removeIndexEntry: (id: string) => void;
  generateIndex: () => IndexEntry[];

  // UI actions
  setActivePanel: (panel: DocumentState['activePanel']) => void;
  setZoom: (zoom: number) => void;
  setViewMode: (mode: DocumentState['viewMode']) => void;
  toggleFindReplace: () => void;
  toggleExportDialog: () => void;
  toggleInsertTableDialog: () => void;
  toggleInsertImageDialog: () => void;
  toggleStyleEditor: () => void;
  toggleMasterPageEditor: () => void;

  // History actions
  pushToHistory: (content: Descendant[]) => void;
  undo: () => Descendant[] | null;
  redo: () => Descendant[] | null;

  // Find/Replace actions
  setFindReplaceOptions: (options: Partial<FindReplaceOptions>) => void;
  performSearch: () => void;
  goToNextResult: () => void;
  goToPrevResult: () => void;
  replaceCurrentResult: () => void;
  replaceAllResults: () => void;
}

const defaultParagraphStyles: ParagraphStyle[] = [
  {
    id: 'body',
    name: 'Body',
    fontFamily: 'Times New Roman',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#000000',
    lineHeight: 1.5,
    textAlign: 'justify',
    marginTop: 0,
    marginBottom: 12,
    marginLeft: 0,
    marginRight: 0,
    firstLineIndent: 24,
    keepWithNext: false,
    keepTogether: false,
    pageBreakBefore: false,
  },
  {
    id: 'heading1',
    name: 'Heading 1',
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'normal',
    color: '#000000',
    lineHeight: 1.2,
    textAlign: 'left',
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 0,
    marginRight: 0,
    firstLineIndent: 0,
    keepWithNext: true,
    keepTogether: true,
    pageBreakBefore: true,
    outlineLevel: 1,
  },
  {
    id: 'heading2',
    name: 'Heading 2',
    fontFamily: 'Arial',
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'normal',
    color: '#333333',
    lineHeight: 1.3,
    textAlign: 'left',
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 0,
    marginRight: 0,
    firstLineIndent: 0,
    keepWithNext: true,
    keepTogether: true,
    pageBreakBefore: false,
    outlineLevel: 2,
  },
  {
    id: 'heading3',
    name: 'Heading 3',
    fontFamily: 'Arial',
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'normal',
    color: '#444444',
    lineHeight: 1.4,
    textAlign: 'left',
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 0,
    marginRight: 0,
    firstLineIndent: 0,
    keepWithNext: true,
    keepTogether: true,
    pageBreakBefore: false,
    outlineLevel: 3,
  },
  {
    id: 'code',
    name: 'Code',
    fontFamily: 'Courier New',
    fontSize: 10,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#333333',
    lineHeight: 1.4,
    textAlign: 'left',
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 24,
    marginRight: 24,
    firstLineIndent: 0,
    keepWithNext: false,
    keepTogether: true,
    pageBreakBefore: false,
  },
  {
    id: 'caption',
    name: 'Caption',
    fontFamily: 'Arial',
    fontSize: 10,
    fontWeight: 'normal',
    fontStyle: 'italic',
    color: '#666666',
    lineHeight: 1.3,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 0,
    marginRight: 0,
    firstLineIndent: 0,
    keepWithNext: false,
    keepTogether: true,
    pageBreakBefore: false,
  },
];

const defaultCharacterStyles: CharacterStyle[] = [
  {
    id: 'emphasis',
    name: 'Emphasis',
    fontStyle: 'italic',
  },
  {
    id: 'strong',
    name: 'Strong',
    fontWeight: 'bold',
  },
  {
    id: 'code-inline',
    name: 'Code',
    fontFamily: 'Courier New',
    backgroundColor: '#f0f0f0',
  },
  {
    id: 'highlight',
    name: 'Highlight',
    backgroundColor: '#ffff00',
  },
];

const defaultMasterPage: MasterPage = {
  id: 'default',
  name: 'Default',
  pageSize: { width: 612, height: 792 }, // Letter size in points
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  columns: 1,
  columnGap: 24,
  headerContent: [],
  footerContent: [],
  backgroundElements: [],
};

const defaultVariables: VariableDefinition[] = [
  { name: 'DocumentTitle', value: 'Untitled Document', type: 'text' },
  { name: 'Author', value: 'Author Name', type: 'text' },
  { name: 'CurrentDate', value: new Date().toLocaleDateString(), type: 'date' },
  { name: 'PageNumber', value: '1', type: 'page' },
  { name: 'TotalPages', value: '1', type: 'page' },
];

const defaultConditions: ConditionTag[] = [
  { name: 'Print', color: '#ff0000', visible: true },
  { name: 'Web', color: '#00ff00', visible: true },
  { name: 'Internal', color: '#0000ff', visible: true },
  { name: 'Draft', color: '#ffaa00', visible: true },
];

const initialContent: Descendant[] = [
  {
    type: 'heading',
    level: 1,
    id: uuidv4(),
    styleId: 'heading1',
    children: [{ text: 'Welcome to FrameMaker Web' }],
  },
  {
    type: 'paragraph',
    styleId: 'body',
    children: [
      {
        text: 'This is a fully-featured document authoring application built with web technologies. Start creating your professional documents with advanced features like structured authoring, cross-references, conditional text, and more.',
      },
    ],
  },
  {
    type: 'heading',
    level: 2,
    id: uuidv4(),
    styleId: 'heading2',
    children: [{ text: 'Getting Started' }],
  },
  {
    type: 'paragraph',
    styleId: 'body',
    children: [
      { text: 'Use the ' },
      { text: 'toolbar', bold: true },
      { text: ' above to format your text, insert elements, and access various features. The ' },
      { text: 'side panels', italic: true },
      { text: ' provide access to document structure, styles, variables, and more.' },
    ],
  },
];

export const useDocumentStore = create<DocumentState>()(
  immer((set, get) => ({
    // Initial state
    currentDocument: null,
    currentBook: null,
    activePanel: 'structure',
    showFindReplace: false,
    showExportDialog: false,
    showInsertTableDialog: false,
    showInsertImageDialog: false,
    showStyleEditor: false,
    showMasterPageEditor: false,
    selectedElement: null,
    zoom: 100,
    viewMode: 'normal',
    documentStructure: [],
    indexEntries: [],
    history: [],
    historyIndex: -1,
    findReplaceOptions: {
      searchText: '',
      replaceText: '',
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
      searchIn: 'document',
      includeStyles: false,
      includeConditions: false,
    },
    searchResults: [],
    currentSearchIndex: -1,

    // Document actions
    createNewDocument: () => {
      const newDoc: FrameMakerDocument = {
        id: uuidv4(),
        name: 'Untitled Document',
        created: new Date(),
        modified: new Date(),
        content: initialContent,
        paragraphStyles: defaultParagraphStyles,
        characterStyles: defaultCharacterStyles,
        masterPages: [defaultMasterPage],
        variables: defaultVariables,
        conditions: defaultConditions,
        metadata: {
          title: 'Untitled Document',
          author: '',
          subject: '',
          keywords: [],
          language: 'en-US',
          version: '1.0',
        },
      };
      set((state) => {
        state.currentDocument = newDoc;
        state.history = [newDoc.content];
        state.historyIndex = 0;
      });
      get().updateDocumentStructure();
    },

    loadDocument: (doc) => {
      set((state) => {
        state.currentDocument = doc;
        state.history = [doc.content];
        state.historyIndex = 0;
      });
      get().updateDocumentStructure();
    },

    saveDocument: () => {
      const { currentDocument } = get();
      if (!currentDocument) return null;

      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.modified = new Date();
        }
      });

      return get().currentDocument;
    },

    updateContent: (content) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.content = content;
          state.currentDocument.modified = new Date();
        }
      });
      get().updateDocumentStructure();
    },

    // Style actions
    addParagraphStyle: (style) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.paragraphStyles.push(style);
        }
      });
    },

    updateParagraphStyle: (id, updates) => {
      set((state) => {
        if (state.currentDocument) {
          const index = state.currentDocument.paragraphStyles.findIndex((s) => s.id === id);
          if (index !== -1) {
            Object.assign(state.currentDocument.paragraphStyles[index], updates);
          }
        }
      });
    },

    deleteParagraphStyle: (id) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.paragraphStyles = state.currentDocument.paragraphStyles.filter(
            (s) => s.id !== id
          );
        }
      });
    },

    addCharacterStyle: (style) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.characterStyles.push(style);
        }
      });
    },

    updateCharacterStyle: (id, updates) => {
      set((state) => {
        if (state.currentDocument) {
          const index = state.currentDocument.characterStyles.findIndex((s) => s.id === id);
          if (index !== -1) {
            Object.assign(state.currentDocument.characterStyles[index], updates);
          }
        }
      });
    },

    deleteCharacterStyle: (id) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.characterStyles = state.currentDocument.characterStyles.filter(
            (s) => s.id !== id
          );
        }
      });
    },

    // Master page actions
    addMasterPage: (page) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.masterPages.push(page);
        }
      });
    },

    updateMasterPage: (id, updates) => {
      set((state) => {
        if (state.currentDocument) {
          const index = state.currentDocument.masterPages.findIndex((p) => p.id === id);
          if (index !== -1) {
            Object.assign(state.currentDocument.masterPages[index], updates);
          }
        }
      });
    },

    deleteMasterPage: (id) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.masterPages = state.currentDocument.masterPages.filter(
            (p) => p.id !== id
          );
        }
      });
    },

    // Variable actions
    addVariable: (variable) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.variables.push(variable);
        }
      });
    },

    updateVariable: (name, value) => {
      set((state) => {
        if (state.currentDocument) {
          const index = state.currentDocument.variables.findIndex((v) => v.name === name);
          if (index !== -1) {
            state.currentDocument.variables[index].value = value;
          }
        }
      });
    },

    deleteVariable: (name) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.variables = state.currentDocument.variables.filter(
            (v) => v.name !== name
          );
        }
      });
    },

    // Condition actions
    addCondition: (condition) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.conditions.push(condition);
        }
      });
    },

    updateCondition: (name, updates) => {
      set((state) => {
        if (state.currentDocument) {
          const index = state.currentDocument.conditions.findIndex((c) => c.name === name);
          if (index !== -1) {
            Object.assign(state.currentDocument.conditions[index], updates);
          }
        }
      });
    },

    deleteCondition: (name) => {
      set((state) => {
        if (state.currentDocument) {
          state.currentDocument.conditions = state.currentDocument.conditions.filter(
            (c) => c.name !== name
          );
        }
      });
    },

    toggleConditionVisibility: (name) => {
      set((state) => {
        if (state.currentDocument) {
          const index = state.currentDocument.conditions.findIndex((c) => c.name === name);
          if (index !== -1) {
            state.currentDocument.conditions[index].visible =
              !state.currentDocument.conditions[index].visible;
          }
        }
      });
    },

    // Book actions
    createNewBook: () => {
      const newBook: Book = {
        id: uuidv4(),
        name: 'Untitled Book',
        documents: [],
        variables: defaultVariables,
        numberingStyle: {
          chapterPrefix: 'Chapter ',
          chapterSuffix: '',
          sectionSeparator: '.',
          pageNumbering: 'continuous',
          startPage: 1,
        },
      };
      set((state) => {
        state.currentBook = newBook;
      });
    },

    addDocumentToBook: (doc) => {
      set((state) => {
        if (state.currentBook) {
          state.currentBook.documents.push(doc);
        }
      });
    },

    removeDocumentFromBook: (id) => {
      set((state) => {
        if (state.currentBook) {
          state.currentBook.documents = state.currentBook.documents.filter((d) => d.id !== id);
        }
      });
    },

    reorderBookDocuments: (fromIndex, toIndex) => {
      set((state) => {
        if (state.currentBook) {
          const docs = state.currentBook.documents;
          const [removed] = docs.splice(fromIndex, 1);
          docs.splice(toIndex, 0, removed);
        }
      });
    },

    // Structure actions
    updateDocumentStructure: () => {
      const { currentDocument } = get();
      if (!currentDocument) return;

      const structure: DocumentSection[] = [];
      const stack: DocumentSection[][] = [structure];

      currentDocument.content.forEach((node) => {
        if ('type' in node && node.type === 'heading' && 'level' in node) {
          const section: DocumentSection = {
            id: node.id,
            title:
              node.children
                .map((child) => ('text' in child ? child.text : ''))
                .join('') || 'Untitled',
            level: node.level,
            children: [],
          };

          while (stack.length > node.level) {
            stack.pop();
          }

          while (stack.length < node.level) {
            const lastSection = stack[stack.length - 1];
            if (lastSection.length > 0) {
              stack.push(lastSection[lastSection.length - 1].children);
            } else {
              break;
            }
          }

          stack[stack.length - 1].push(section);

          if (stack.length === node.level) {
            stack.push(section.children);
          }
        }
      });

      set((state) => {
        state.documentStructure = structure;
      });
    },

    // Index actions
    addIndexEntry: (entry) => {
      set((state) => {
        state.indexEntries.push(entry);
      });
    },

    removeIndexEntry: (id) => {
      set((state) => {
        state.indexEntries = state.indexEntries.filter((e) => e.id !== id);
      });
    },

    generateIndex: () => {
      const { indexEntries } = get();
      return [...indexEntries].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    },

    // UI actions
    setActivePanel: (panel) => {
      set((state) => {
        state.activePanel = panel;
      });
    },

    setZoom: (zoom) => {
      set((state) => {
        state.zoom = Math.max(25, Math.min(400, zoom));
      });
    },

    setViewMode: (mode) => {
      set((state) => {
        state.viewMode = mode;
      });
    },

    toggleFindReplace: () => {
      set((state) => {
        state.showFindReplace = !state.showFindReplace;
      });
    },

    toggleExportDialog: () => {
      set((state) => {
        state.showExportDialog = !state.showExportDialog;
      });
    },

    toggleInsertTableDialog: () => {
      set((state) => {
        state.showInsertTableDialog = !state.showInsertTableDialog;
      });
    },

    toggleInsertImageDialog: () => {
      set((state) => {
        state.showInsertImageDialog = !state.showInsertImageDialog;
      });
    },

    toggleStyleEditor: () => {
      set((state) => {
        state.showStyleEditor = !state.showStyleEditor;
      });
    },

    toggleMasterPageEditor: () => {
      set((state) => {
        state.showMasterPageEditor = !state.showMasterPageEditor;
      });
    },

    // History actions
    pushToHistory: (content) => {
      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(content);
        if (newHistory.length > 100) {
          newHistory.shift();
        }
        state.history = newHistory;
        state.historyIndex = newHistory.length - 1;
      });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const content = history[newIndex];
        set((state) => {
          state.historyIndex = newIndex;
          if (state.currentDocument) {
            state.currentDocument.content = content;
          }
        });
        return content;
      }
      return null;
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const content = history[newIndex];
        set((state) => {
          state.historyIndex = newIndex;
          if (state.currentDocument) {
            state.currentDocument.content = content;
          }
        });
        return content;
      }
      return null;
    },

    // Find/Replace actions
    setFindReplaceOptions: (options) => {
      set((state) => {
        Object.assign(state.findReplaceOptions, options);
      });
    },

    performSearch: () => {
      // Implement search logic
      set((state) => {
        state.searchResults = [];
        state.currentSearchIndex = -1;
      });
    },

    goToNextResult: () => {
      set((state) => {
        if (state.searchResults.length > 0) {
          state.currentSearchIndex = (state.currentSearchIndex + 1) % state.searchResults.length;
        }
      });
    },

    goToPrevResult: () => {
      set((state) => {
        if (state.searchResults.length > 0) {
          state.currentSearchIndex =
            state.currentSearchIndex <= 0
              ? state.searchResults.length - 1
              : state.currentSearchIndex - 1;
        }
      });
    },

    replaceCurrentResult: () => {
      // Implement replace logic
    },

    replaceAllResults: () => {
      // Implement replace all logic
    },
  }))
);
