// Character Catalog - shows all character formats and allows applying them
import React, { useState } from 'react';
import { store, useStore } from '../document/store';

interface CharacterCatalogProps {
  visible: boolean;
  onClose: () => void;
}

export const CharacterCatalog: React.FC<CharacterCatalogProps> = ({ visible, onClose }) => {
  const state = useStore();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 330, y: 150 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!visible) return null;

  const formats = state.document.catalog.characterFormats;

  const handleApplyFormat = (tag: string) => {
    if (state.cursor && state.editingFrameId) {
      store.applyCharacterFormat(tag);
    }
  };

  const handleNewFormat = () => {
    const tagName = prompt('Enter character format tag name:');
    if (tagName && tagName.trim()) {
      store.createCharacterFormat(tagName.trim());
    }
  };

  const handleEditFormat = (tag: string) => {
    setSelectedTag(tag);
    // Could open a Character Designer dialog
    window.dispatchEvent(new CustomEvent('showCharacterDialog'));
  };

  const handleDeleteFormat = (tag: string) => {
    if (tag === 'Default') {
      alert('Cannot delete the Default format.');
      return;
    }
    if (confirm(`Delete character format "${tag}"?`)) {
      store.deleteCharacterFormat(tag);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).className.includes('catalog-title-bar')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div
      className="fm-catalog-panel"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: 220,
        backgroundColor: '#c0c0c0',
        border: '2px solid #ffffff',
        borderRightColor: '#404040',
        borderBottomColor: '#404040',
        boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        zIndex: 1000,
        fontFamily: 'MS Sans Serif, sans-serif',
        fontSize: '11px',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title bar */}
      <div
        className="catalog-title-bar"
        style={{
          background: '#000080',
          color: 'white',
          padding: '2px 4px',
          fontWeight: 'bold',
          fontSize: '11px',
          cursor: 'move',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Character Catalog</span>
        <button
          onClick={onClose}
          style={{
            background: '#c0c0c0',
            border: '1px solid',
            borderColor: '#ffffff #000000 #000000 #ffffff',
            width: 16,
            height: 14,
            fontSize: '9px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Format list */}
      <div
        style={{
          maxHeight: 400,
          overflowY: 'auto',
          background: 'white',
          border: '2px inset #808080',
          margin: 4,
        }}
      >
        {formats.map((format) => {
          const props = format.properties;
          return (
            <div
              key={format.tag}
              onClick={() => handleApplyFormat(format.tag)}
              onDoubleClick={() => handleEditFormat(format.tag)}
              style={{
                padding: '4px 8px',
                cursor: 'pointer',
                backgroundColor: selectedTag === format.tag ? '#000080' : 'transparent',
                color: selectedTag === format.tag ? 'white' : (props.color || 'black'),
                fontFamily: props.family || 'Times New Roman',
                fontSize: `${props.size ? Math.min(props.size, 12) : 11}px`,
                fontWeight: props.weight || 'normal',
                fontStyle: props.style || 'normal',
                textDecoration: props.underline ? 'underline' : props.strikethrough ? 'line-through' : 'none',
                borderBottom: '1px solid #e0e0e0',
              }}
              title={`Double-click to edit "${format.tag}"`}
            >
              {format.tag}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div
        style={{
          padding: 4,
          display: 'flex',
          gap: 4,
          borderTop: '1px solid #808080',
        }}
      >
        <button
          onClick={handleNewFormat}
          style={{
            flex: 1,
            padding: '3px 6px',
            background: '#c0c0c0',
            border: '2px solid',
            borderColor: '#ffffff #404040 #404040 #ffffff',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          New...
        </button>
        <button
          onClick={() => selectedTag && handleEditFormat(selectedTag)}
          disabled={!selectedTag}
          style={{
            flex: 1,
            padding: '3px 6px',
            background: '#c0c0c0',
            border: '2px solid',
            borderColor: '#ffffff #404040 #404040 #ffffff',
            fontSize: '11px',
            cursor: selectedTag ? 'pointer' : 'not-allowed',
            opacity: selectedTag ? 1 : 0.5,
          }}
        >
          Edit...
        </button>
        <button
          onClick={() => selectedTag && handleDeleteFormat(selectedTag)}
          disabled={!selectedTag || selectedTag === 'Default'}
          style={{
            flex: 1,
            padding: '3px 6px',
            background: '#c0c0c0',
            border: '2px solid',
            borderColor: '#ffffff #404040 #404040 #ffffff',
            fontSize: '11px',
            cursor: selectedTag && selectedTag !== 'Default' ? 'pointer' : 'not-allowed',
            opacity: selectedTag && selectedTag !== 'Default' ? 1 : 0.5,
          }}
        >
          Delete
        </button>
      </div>

      {/* Info text */}
      <div
        style={{
          padding: '4px 8px',
          fontSize: '10px',
          color: '#404040',
          borderTop: '1px solid #808080',
          backgroundColor: '#f0f0f0',
        }}
      >
        Click to apply, double-click to edit
      </div>
    </div>
  );
};
