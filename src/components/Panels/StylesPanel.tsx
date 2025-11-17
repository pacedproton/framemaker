import React, { useState } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import type { ParagraphStyle, CharacterStyle } from '../../types/document';
import { v4 as uuidv4 } from 'uuid';
import { Type, Palette, Plus, Edit2, Trash2, Copy } from 'lucide-react';

const StylesPanel: React.FC = () => {
  const {
    currentDocument,
    addParagraphStyle,
    updateParagraphStyle,
    deleteParagraphStyle,
    addCharacterStyle,
    deleteCharacterStyle,
  } = useDocumentStore();

  const [activeTab, setActiveTab] = useState<'paragraph' | 'character'>('paragraph');
  const [editingStyle, setEditingStyle] = useState<string | null>(null);
  const [showNewStyleForm, setShowNewStyleForm] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');

  if (!currentDocument) {
    return (
      <div className="panel styles-panel">
        <div className="panel-header">
          <h3>Styles</h3>
        </div>
        <div className="panel-content empty">
          <p>No document open</p>
        </div>
      </div>
    );
  }

  const handleAddParagraphStyle = () => {
    if (!newStyleName.trim()) return;

    const newStyle: ParagraphStyle = {
      id: uuidv4(),
      name: newStyleName,
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      lineHeight: 1.5,
      textAlign: 'left',
      marginTop: 0,
      marginBottom: 12,
      marginLeft: 0,
      marginRight: 0,
      firstLineIndent: 0,
      keepWithNext: false,
      keepTogether: false,
      pageBreakBefore: false,
    };
    addParagraphStyle(newStyle);
    setNewStyleName('');
    setShowNewStyleForm(false);
  };

  const handleAddCharacterStyle = () => {
    if (!newStyleName.trim()) return;

    const newStyle: CharacterStyle = {
      id: uuidv4(),
      name: newStyleName,
    };
    addCharacterStyle(newStyle);
    setNewStyleName('');
    setShowNewStyleForm(false);
  };

  const handleDuplicateStyle = (style: ParagraphStyle | CharacterStyle) => {
    if (activeTab === 'paragraph') {
      const newStyle: ParagraphStyle = {
        ...(style as ParagraphStyle),
        id: uuidv4(),
        name: `${style.name} Copy`,
      };
      addParagraphStyle(newStyle);
    } else {
      const newStyle: CharacterStyle = {
        ...(style as CharacterStyle),
        id: uuidv4(),
        name: `${style.name} Copy`,
      };
      addCharacterStyle(newStyle);
    }
  };

  return (
    <div className="panel styles-panel">
      <div className="panel-header">
        <h3>
          <Palette size={16} />
          Styles
        </h3>
        <div className="panel-actions">
          <button
            className="panel-action-button"
            onClick={() => setShowNewStyleForm(true)}
            title="Add New Style"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="panel-tabs">
        <button
          className={`panel-tab ${activeTab === 'paragraph' ? 'active' : ''}`}
          onClick={() => setActiveTab('paragraph')}
        >
          <Type size={14} />
          Paragraph
        </button>
        <button
          className={`panel-tab ${activeTab === 'character' ? 'active' : ''}`}
          onClick={() => setActiveTab('character')}
        >
          <Type size={14} />
          Character
        </button>
      </div>

      <div className="panel-content">
        {showNewStyleForm && (
          <div className="new-style-form">
            <input
              type="text"
              placeholder="Style name"
              value={newStyleName}
              onChange={(e) => setNewStyleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  activeTab === 'paragraph' ? handleAddParagraphStyle() : handleAddCharacterStyle();
                }
                if (e.key === 'Escape') {
                  setShowNewStyleForm(false);
                  setNewStyleName('');
                }
              }}
              autoFocus
            />
            <div className="form-actions">
              <button
                onClick={
                  activeTab === 'paragraph' ? handleAddParagraphStyle : handleAddCharacterStyle
                }
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowNewStyleForm(false);
                  setNewStyleName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeTab === 'paragraph' && (
          <div className="styles-list">
            {currentDocument.paragraphStyles.map((style) => (
              <div key={style.id} className="style-item">
                <div className="style-preview" style={getStylePreviewCSS(style)}>
                  Aa
                </div>
                <div className="style-info">
                  <div className="style-name">{style.name}</div>
                  <div className="style-details">
                    {style.fontFamily}, {style.fontSize}pt
                  </div>
                </div>
                <div className="style-actions">
                  <button
                    className="style-action-button"
                    onClick={() => setEditingStyle(style.id)}
                    title="Edit Style"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    className="style-action-button"
                    onClick={() => handleDuplicateStyle(style)}
                    title="Duplicate Style"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    className="style-action-button delete"
                    onClick={() => deleteParagraphStyle(style.id)}
                    title="Delete Style"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {editingStyle === style.id && (
                  <StyleEditor
                    style={style}
                    onSave={(updates) => {
                      updateParagraphStyle(style.id, updates);
                      setEditingStyle(null);
                    }}
                    onCancel={() => setEditingStyle(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'character' && (
          <div className="styles-list">
            {currentDocument.characterStyles.map((style) => (
              <div key={style.id} className="style-item">
                <div className="style-preview" style={getCharStylePreviewCSS(style)}>
                  Aa
                </div>
                <div className="style-info">
                  <div className="style-name">{style.name}</div>
                  <div className="style-details">
                    {style.fontFamily || 'Default'}, {style.fontWeight || 'normal'}
                  </div>
                </div>
                <div className="style-actions">
                  <button
                    className="style-action-button"
                    onClick={() => setEditingStyle(style.id)}
                    title="Edit Style"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    className="style-action-button"
                    onClick={() => handleDuplicateStyle(style)}
                    title="Duplicate Style"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    className="style-action-button delete"
                    onClick={() => deleteCharacterStyle(style.id)}
                    title="Delete Style"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface StyleEditorProps {
  style: ParagraphStyle;
  onSave: (updates: Partial<ParagraphStyle>) => void;
  onCancel: () => void;
}

const StyleEditor: React.FC<StyleEditorProps> = ({ style, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<ParagraphStyle>>({ ...style });

  return (
    <div className="style-editor">
      <div className="editor-section">
        <h4>Font</h4>
        <div className="form-group">
          <label>Family</label>
          <select
            value={formData.fontFamily}
            onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>
        <div className="form-group">
          <label>Size (pt)</label>
          <input
            type="number"
            value={formData.fontSize}
            onChange={(e) => setFormData({ ...formData, fontSize: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Weight</label>
          <select
            value={formData.fontWeight}
            onChange={(e) =>
              setFormData({ ...formData, fontWeight: e.target.value as 'normal' | 'bold' })
            }
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        <div className="form-group">
          <label>Style</label>
          <select
            value={formData.fontStyle}
            onChange={(e) =>
              setFormData({ ...formData, fontStyle: e.target.value as 'normal' | 'italic' })
            }
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </div>
        <div className="form-group">
          <label>Color</label>
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
        </div>
      </div>

      <div className="editor-section">
        <h4>Paragraph</h4>
        <div className="form-group">
          <label>Line Height</label>
          <input
            type="number"
            step="0.1"
            value={formData.lineHeight}
            onChange={(e) => setFormData({ ...formData, lineHeight: parseFloat(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Alignment</label>
          <select
            value={formData.textAlign}
            onChange={(e) =>
              setFormData({
                ...formData,
                textAlign: e.target.value as 'left' | 'center' | 'right' | 'justify',
              })
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>
        <div className="form-group">
          <label>First Line Indent (px)</label>
          <input
            type="number"
            value={formData.firstLineIndent}
            onChange={(e) =>
              setFormData({ ...formData, firstLineIndent: parseInt(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="editor-section">
        <h4>Spacing</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Top</label>
            <input
              type="number"
              value={formData.marginTop}
              onChange={(e) => setFormData({ ...formData, marginTop: parseInt(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Bottom</label>
            <input
              type="number"
              value={formData.marginBottom}
              onChange={(e) => setFormData({ ...formData, marginBottom: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Left</label>
            <input
              type="number"
              value={formData.marginLeft}
              onChange={(e) => setFormData({ ...formData, marginLeft: parseInt(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Right</label>
            <input
              type="number"
              value={formData.marginRight}
              onChange={(e) => setFormData({ ...formData, marginRight: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="editor-section">
        <h4>Pagination</h4>
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="keepWithNext"
            checked={formData.keepWithNext}
            onChange={(e) => setFormData({ ...formData, keepWithNext: e.target.checked })}
          />
          <label htmlFor="keepWithNext">Keep with next</label>
        </div>
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="keepTogether"
            checked={formData.keepTogether}
            onChange={(e) => setFormData({ ...formData, keepTogether: e.target.checked })}
          />
          <label htmlFor="keepTogether">Keep together</label>
        </div>
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="pageBreakBefore"
            checked={formData.pageBreakBefore}
            onChange={(e) => setFormData({ ...formData, pageBreakBefore: e.target.checked })}
          />
          <label htmlFor="pageBreakBefore">Page break before</label>
        </div>
      </div>

      <div className="editor-actions">
        <button className="save-button" onClick={() => onSave(formData)}>
          Save
        </button>
        <button className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

const getStylePreviewCSS = (style: ParagraphStyle): React.CSSProperties => ({
  fontFamily: style.fontFamily,
  fontSize: `${Math.min(style.fontSize, 16)}px`,
  fontWeight: style.fontWeight,
  fontStyle: style.fontStyle,
  color: style.color,
});

const getCharStylePreviewCSS = (style: CharacterStyle): React.CSSProperties => ({
  fontFamily: style.fontFamily || 'inherit',
  fontWeight: style.fontWeight || 'normal',
  fontStyle: style.fontStyle || 'normal',
  color: style.color || '#000000',
  backgroundColor: style.backgroundColor || 'transparent',
});

export default StylesPanel;
