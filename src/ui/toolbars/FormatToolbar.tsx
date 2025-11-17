// Format Toolbar - paragraph and character formatting
import React, { useState } from 'react';
import { store, useStore } from '../../document/store';

export const FormatToolbar: React.FC = () => {
  const state = useStore();
  const [fontFamily, setFontFamily] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState('12');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const handleParagraphFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    store.applyParagraphFormat(e.target.value);
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(e.target.value);
    store.applyFontFamily(e.target.value);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontSize(e.target.value);
    store.applyFontSize(parseInt(e.target.value));
  };

  const handleBoldClick = () => {
    setIsBold(!isBold);
    store.toggleBold();
  };

  const handleItalicClick = () => {
    setIsItalic(!isItalic);
    store.toggleItalic();
  };

  const handleUnderlineClick = () => {
    setIsUnderline(!isUnderline);
    store.toggleUnderline();
  };

  const handleAlignClick = (align: 'left' | 'center' | 'right' | 'justified') => {
    store.setAlignment(align);
  };

  return (
    <div className="fm-format-toolbar">
      <div className="toolbar-group">
        <select
          className="format-select para-format"
          value={getCurrentParagraphTag()}
          onChange={handleParagraphFormatChange}
          title="Paragraph Format"
        >
          {state.document.catalog.paragraphFormats.map((format) => (
            <option key={format.tag} value={format.tag}>
              {format.tag}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <select
          className="format-select font-family"
          value={fontFamily}
          onChange={handleFontFamilyChange}
          title="Font Family"
        >
          <option value="Times New Roman">Times New Roman</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Arial">Arial</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
        </select>

        <select
          className="format-select font-size"
          value={fontSize}
          onChange={handleFontSizeChange}
          title="Font Size"
        >
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
          <option value="24">24</option>
          <option value="30">30</option>
          <option value="36">36</option>
          <option value="48">48</option>
          <option value="60">60</option>
          <option value="72">72</option>
        </select>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className={`format-btn ${isBold ? 'active' : ''}`}
          onClick={handleBoldClick}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          className={`format-btn ${isItalic ? 'active' : ''}`}
          onClick={handleItalicClick}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          className={`format-btn ${isUnderline ? 'active' : ''}`}
          onClick={handleUnderlineClick}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="format-btn"
          onClick={() => handleAlignClick('left')}
          title="Align Left"
        >
          ⫷
        </button>
        <button
          className="format-btn"
          onClick={() => handleAlignClick('center')}
          title="Align Center"
        >
          ⫶
        </button>
        <button
          className="format-btn"
          onClick={() => handleAlignClick('right')}
          title="Align Right"
        >
          ⫸
        </button>
        <button
          className="format-btn"
          onClick={() => handleAlignClick('justified')}
          title="Justify"
        >
          ≡
        </button>
      </div>
    </div>
  );

  function getCurrentParagraphTag(): string {
    if (!state.cursor || !state.editingFrameId) return 'Body';

    const frame = store.getTextFrame(state.editingFrameId);
    if (!frame) return 'Body';

    const para = frame.paragraphs.find((p) => p.id === state.cursor!.paragraphId);
    return para ? para.formatTag : 'Body';
  }
};
