import React from 'react';
import { useSlate } from 'slate-react';
import { Editor, Transforms } from 'slate';
import { useDocumentStore } from '../../store/documentStore';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Superscript,
  Subscript,
  List,
  ListOrdered,
  Quote,
  Table,
  Image,
  Variable,
  Link2,
  BookMarked,
  Undo2,
  Redo2,
  Save,
  FileDown,
  Printer,
  Search,
  ZoomIn,
  ZoomOut,
  Eye,
  FileText,
  Settings,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import {
  toggleList,
  toggleBlockQuote,
  toggleCodeBlock,
} from '../Editor/RichTextEditor';
import { v4 as uuidv4 } from 'uuid';

const MainToolbar: React.FC = () => {
  const {
    zoom,
    setZoom,
    viewMode,
    setViewMode,
    toggleFindReplace,
    toggleExportDialog,
    toggleStyleEditor,
    undo,
    redo,
    saveDocument,
    historyIndex,
    history,
  } = useDocumentStore();

  const handleSave = () => {
    const doc = saveDocument();
    if (doc) {
      const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name}.fmweb`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleZoomIn = () => setZoom(zoom + 10);
  const handleZoomOut = () => setZoom(zoom - 10);

  return (
    <div className="main-toolbar">
      <div className="toolbar-group">
        <button className="toolbar-button" onClick={handleSave} title="Save (Ctrl+S)">
          <Save size={18} />
        </button>
        <button className="toolbar-button" onClick={toggleExportDialog} title="Export">
          <FileDown size={18} />
        </button>
        <button className="toolbar-button" onClick={() => window.print()} title="Print">
          <Printer size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={() => undo()}
          disabled={historyIndex <= 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button
          className="toolbar-button"
          onClick={() => redo()}
          disabled={historyIndex >= history.length - 1}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button className="toolbar-button" onClick={toggleFindReplace} title="Find & Replace (Ctrl+H)">
          <Search size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button className="toolbar-button" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={18} />
        </button>
        <span className="zoom-display">{zoom}%</span>
        <button className="toolbar-button" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className={`toolbar-button ${viewMode === 'normal' ? 'active' : ''}`}
          onClick={() => setViewMode('normal')}
          title="Normal View"
        >
          <FileText size={18} />
        </button>
        <button
          className={`toolbar-button ${viewMode === 'preview' ? 'active' : ''}`}
          onClick={() => setViewMode('preview')}
          title="Preview"
        >
          <Eye size={18} />
        </button>
        <button
          className={`toolbar-button ${viewMode === 'structure' ? 'active' : ''}`}
          onClick={() => setViewMode('structure')}
          title="Structure View"
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button className="toolbar-button" onClick={toggleStyleEditor} title="Style Editor">
          <Palette size={18} />
        </button>
      </div>
    </div>
  );
};

export const FormatToolbar: React.FC = () => {
  const editor = useSlate();
  const { currentDocument: doc, toggleInsertTableDialog: showTableDialog, toggleInsertImageDialog: showImageDialog } = useDocumentStore();

  const isMarkActive = (format: string) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format as keyof typeof marks] === true : false;
  };

  const toggleMark = (format: string) => {
    const isActive = isMarkActive(format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const setHeading = (level: 1 | 2 | 3) => {
    const heading = {
      type: 'heading' as const,
      level,
      id: uuidv4(),
      children: [{ text: '' }],
    };
    Transforms.setNodes(editor, heading);
  };

  if (!doc) return null;

  return (
    <div className="format-toolbar">
      <div className="toolbar-group">
        <select
          className="toolbar-select"
          onChange={(e) => {
            const style = doc.paragraphStyles.find((s: { id: string }) => s.id === e.target.value);
            if (style) {
              // Apply paragraph style
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Paragraph Style
          </option>
          {doc.paragraphStyles.map((style) => (
            <option key={style.id} value={style.id}>
              {style.name}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={() => setHeading(1)}
          title="Heading 1 (Ctrl+Shift+1)"
        >
          <Heading1 size={18} />
        </button>
        <button
          className="toolbar-button"
          onClick={() => setHeading(2)}
          title="Heading 2 (Ctrl+Shift+2)"
        >
          <Heading2 size={18} />
        </button>
        <button
          className="toolbar-button"
          onClick={() => setHeading(3)}
          title="Heading 3 (Ctrl+Shift+3)"
        >
          <Heading3 size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className={`toolbar-button ${isMarkActive('bold') ? 'active' : ''}`}
          onClick={() => toggleMark('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold size={18} />
        </button>
        <button
          className={`toolbar-button ${isMarkActive('italic') ? 'active' : ''}`}
          onClick={() => toggleMark('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic size={18} />
        </button>
        <button
          className={`toolbar-button ${isMarkActive('underline') ? 'active' : ''}`}
          onClick={() => toggleMark('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline size={18} />
        </button>
        <button
          className={`toolbar-button ${isMarkActive('strikethrough') ? 'active' : ''}`}
          onClick={() => toggleMark('strikethrough')}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className={`toolbar-button ${isMarkActive('superscript') ? 'active' : ''}`}
          onClick={() => toggleMark('superscript')}
          title="Superscript"
        >
          <Superscript size={18} />
        </button>
        <button
          className={`toolbar-button ${isMarkActive('subscript') ? 'active' : ''}`}
          onClick={() => toggleMark('subscript')}
          title="Subscript"
        >
          <Subscript size={18} />
        </button>
        <button
          className={`toolbar-button ${isMarkActive('code') ? 'active' : ''}`}
          onClick={() => toggleMark('code')}
          title="Inline Code (Ctrl+`)"
        >
          <Code size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={() => toggleList(editor, 'bulleted-list')}
          title="Bulleted List"
        >
          <List size={18} />
        </button>
        <button
          className="toolbar-button"
          onClick={() => toggleList(editor, 'numbered-list')}
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </button>
        <button className="toolbar-button" onClick={() => toggleBlockQuote(editor)} title="Block Quote">
          <Quote size={18} />
        </button>
        <button className="toolbar-button" onClick={() => toggleCodeBlock(editor)} title="Code Block">
          <Code size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button className="toolbar-button" onClick={showTableDialog} title="Insert Table">
          <Table size={18} />
        </button>
        <button className="toolbar-button" onClick={showImageDialog} title="Insert Image">
          <Image size={18} />
        </button>
        <button className="toolbar-button" title="Insert Variable">
          <Variable size={18} />
        </button>
        <button className="toolbar-button" title="Insert Cross-Reference">
          <Link2 size={18} />
        </button>
        <button className="toolbar-button" title="Insert Index Marker">
          <BookMarked size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button className="toolbar-button" title="Align Left">
          <AlignLeft size={18} />
        </button>
        <button className="toolbar-button" title="Align Center">
          <AlignCenter size={18} />
        </button>
        <button className="toolbar-button" title="Align Right">
          <AlignRight size={18} />
        </button>
        <button className="toolbar-button" title="Justify">
          <AlignJustify size={18} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <select className="toolbar-select font-family-select">
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Helvetica">Helvetica</option>
        </select>
        <select className="toolbar-select font-size-select">
          {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((size) => (
            <option key={size} value={size}>
              {size}pt
            </option>
          ))}
        </select>
        <input type="color" className="color-picker" title="Text Color" defaultValue="#000000" />
        <input
          type="color"
          className="color-picker"
          title="Background Color"
          defaultValue="#ffffff"
        />
      </div>
    </div>
  );
};

export default MainToolbar;
