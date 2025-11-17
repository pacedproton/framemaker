import React, { useState, useRef, useEffect } from 'react';
import { useDocumentStore } from '../store/documentStore';
import {
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  label?: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
}

const MenuBar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    createNewDocument,
    saveDocument,
    toggleFindReplace,
    toggleExportDialog,
    toggleStyleEditor,
    toggleMasterPageEditor,
    undo,
    redo,
    createNewBook,
  } = useDocumentStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.fmweb,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const doc = JSON.parse(event.target?.result as string);
            useDocumentStore.getState().loadDocument(doc);
            setActiveMenu(null);
          } catch (error) {
            alert('Failed to load document. Invalid file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New Document', shortcut: 'Ctrl+N', action: () => { createNewDocument(); setActiveMenu(null); } },
      { label: 'New Book', action: () => { createNewBook(); setActiveMenu(null); } },
      { separator: true },
      { label: 'Open...', shortcut: 'Ctrl+O', action: handleFileLoad },
      { label: 'Open Recent', submenu: [
        { label: 'No recent files', disabled: true },
      ]},
      { separator: true },
      { label: 'Save', shortcut: 'Ctrl+S', action: () => { saveDocument(); setActiveMenu(null); } },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
      { separator: true },
      { label: 'Export...', action: () => { toggleExportDialog(); setActiveMenu(null); } },
      { label: 'Print...', shortcut: 'Ctrl+P', action: () => { window.print(); setActiveMenu(null); } },
      { separator: true },
      { label: 'Document Properties...' },
      { separator: true },
      { label: 'Close Document', shortcut: 'Ctrl+W' },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: () => { undo(); setActiveMenu(null); } },
      { label: 'Redo', shortcut: 'Ctrl+Y', action: () => { redo(); setActiveMenu(null); } },
      { separator: true },
      { label: 'Cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', shortcut: 'Ctrl+V' },
      { label: 'Paste Special...' },
      { separator: true },
      { label: 'Find/Replace...', shortcut: 'Ctrl+H', action: () => { toggleFindReplace(); setActiveMenu(null); } },
      { label: 'Find Next', shortcut: 'F3' },
      { separator: true },
      { label: 'Select All', shortcut: 'Ctrl+A' },
    ],
    Format: [
      { label: 'Character...', submenu: [
        { label: 'Bold', shortcut: 'Ctrl+B' },
        { label: 'Italic', shortcut: 'Ctrl+I' },
        { label: 'Underline', shortcut: 'Ctrl+U' },
        { label: 'Strikethrough' },
        { separator: true },
        { label: 'Superscript' },
        { label: 'Subscript' },
      ]},
      { label: 'Paragraph...', submenu: [
        { label: 'Align Left' },
        { label: 'Align Center' },
        { label: 'Align Right' },
        { label: 'Justify' },
      ]},
      { separator: true },
      { label: 'Styles...', action: () => { toggleStyleEditor(); setActiveMenu(null); } },
      { label: 'Paragraph Designer...' },
      { label: 'Character Designer...' },
      { separator: true },
      { label: 'Bullets & Numbering...' },
      { label: 'Tabs...' },
    ],
    Insert: [
      { label: 'Table...' },
      { label: 'Image...' },
      { label: 'Anchored Frame...' },
      { separator: true },
      { label: 'Cross-Reference...' },
      { label: 'Variable...' },
      { label: 'Index Marker...' },
      { separator: true },
      { label: 'Special Character...', submenu: [
        { label: 'Em Dash —' },
        { label: 'En Dash –' },
        { label: 'Non-breaking Space' },
        { label: 'Soft Hyphen' },
      ]},
      { separator: true },
      { label: 'Page Break' },
      { label: 'Column Break' },
      { label: 'Section Break' },
    ],
    View: [
      { label: 'Normal View' },
      { label: 'Preview Mode' },
      { label: 'Structure View' },
      { separator: true },
      { label: 'Show/Hide', submenu: [
        { label: 'Toolbar' },
        { label: 'Format Bar' },
        { label: 'Status Bar' },
        { label: 'Rulers' },
        { label: 'Guides' },
      ]},
      { separator: true },
      { label: 'Zoom In', shortcut: 'Ctrl+=' },
      { label: 'Zoom Out', shortcut: 'Ctrl+-' },
      { label: 'Fit Page in Window' },
      { label: '100%' },
    ],
    Special: [
      { label: 'Conditional Text...', submenu: [
        { label: 'Show/Hide...' },
        { label: 'Apply Conditions...' },
        { label: 'Edit Conditions...' },
      ]},
      { label: 'Variables...', submenu: [
        { label: 'Insert Variable' },
        { label: 'Edit Variables...' },
      ]},
      { separator: true },
      { label: 'Master Pages...', action: () => { toggleMasterPageEditor(); setActiveMenu(null); } },
      { label: 'Reference Pages...' },
      { separator: true },
      { label: 'Table of Contents...' },
      { label: 'Index...' },
      { label: 'Glossary...' },
    ],
    Help: [
      { label: 'Getting Started' },
      { label: 'User Guide' },
      { label: 'Keyboard Shortcuts' },
      { separator: true },
      { label: 'About FrameMaker Web' },
    ],
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.separator) {
      return <div key={index} className="menu-separator" />;
    }

    return (
      <div
        key={index}
        className={`menu-item ${item.disabled ? 'disabled' : ''} ${item.submenu ? 'has-submenu' : ''}`}
        onClick={(e) => {
          if (!item.disabled && !item.submenu && item.action) {
            e.stopPropagation();
            item.action();
          }
        }}
      >
        <span className="menu-item-label">{item.label}</span>
        {item.shortcut && <span className="menu-item-shortcut">{item.shortcut}</span>}
        {item.submenu && (
          <>
            <ChevronRight size={14} className="submenu-arrow" />
            <div className="submenu">
              {item.submenu.map((subitem, subindex) => renderMenuItem(subitem, subindex))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="menu-bar" ref={menuRef}>
      {Object.entries(menus).map(([name, items]) => (
        <div
          key={name}
          className={`menu-item-top ${activeMenu === name ? 'active' : ''}`}
          onMouseEnter={() => activeMenu && setActiveMenu(name)}
          onClick={() => setActiveMenu(activeMenu === name ? null : name)}
        >
          <span>{name}</span>
          {activeMenu === name && (
            <div className="menu-dropdown">
              {items.map((item, index) => renderMenuItem(item, index))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MenuBar;
