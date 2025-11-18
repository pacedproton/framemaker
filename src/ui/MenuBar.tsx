// Dropdown Menu System
import React, { useState, useRef, useEffect } from 'react';
import { store } from '../document/store';

interface MenuItem {
  label?: string;
  action?: () => void;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
  submenu?: MenuItem[];
}

interface MenuProps {
  label: string;
  items: MenuItem[];
}

export const Menu: React.FC<MenuProps> = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    if (item.action && !item.disabled) {
      item.action();
      setIsOpen(false);
    }
  };

  return (
    <div className="fm-menu" ref={menuRef}>
      <div
        className={`menu-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => {
          // Auto-open when hovering if another menu is open
          const openMenus = document.querySelectorAll('.fm-menu .menu-dropdown');
          if (openMenus.length > 0) {
            setIsOpen(true);
          }
        }}
      >
        {label}
      </div>

      {isOpen && (
        <div className="menu-dropdown">
          {items.map((item, index) =>
            item.separator ? (
              <div key={index} className="menu-separator" />
            ) : (
              <div
                key={index}
                className={`menu-item ${item.disabled ? 'disabled' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <span className="menu-label">{item.label}</span>
                {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

// Application Title Bar - classic Windows style
export const AppTitleBar: React.FC = () => {
  return (
    <div className="fm-app-titlebar">
      <div className="titlebar-icon">FM</div>
      <div className="titlebar-title">FrameMaker Web</div>
      <div className="titlebar-buttons">
        <button className="titlebar-btn minimize" title="Minimize">_</button>
        <button className="titlebar-btn maximize" title="Maximize">□</button>
        <button className="titlebar-btn close" title="Close">×</button>
      </div>
    </div>
  );
};

// Complete menu bar with all menus
export const MenuBar: React.FC = () => {
  const fileMenuItems: MenuItem[] = [
    { label: 'New', shortcut: 'Ctrl+N', action: () => store.newDocument('Untitled') },
    { label: 'Open...', shortcut: 'Ctrl+O', disabled: true },
    { label: 'Close', shortcut: 'Ctrl+W', disabled: true },
    { separator: true },
    { label: 'Save', shortcut: 'Ctrl+S', disabled: true },
    { label: 'Save As...', shortcut: 'Ctrl+Shift+S', disabled: true },
    { separator: true },
    { label: 'Import...', disabled: true },
    { label: 'Export...', disabled: true },
    { separator: true },
    { label: 'Print...', shortcut: 'Ctrl+P', disabled: true },
    { separator: true },
    {
      label: 'Document Statistics...',
      action: () => window.dispatchEvent(new CustomEvent('showDocumentStatsDialog')),
    },
    { separator: true },
    { label: 'Exit', action: () => window.close() },
  ];

  const editMenuItems: MenuItem[] = [
    { label: 'Undo', shortcut: 'Ctrl+Z', action: () => store.undo() },
    { label: 'Redo', shortcut: 'Ctrl+Y', action: () => store.redo() },
    { separator: true },
    { label: 'Cut', shortcut: 'Ctrl+X', disabled: true },
    { label: 'Copy', shortcut: 'Ctrl+C', disabled: true },
    { label: 'Paste', shortcut: 'Ctrl+V', disabled: true },
    { label: 'Clear', disabled: true },
    { separator: true },
    { label: 'Select All in Flow', shortcut: 'Ctrl+A', disabled: true },
    { separator: true },
    {
      label: 'Find/Change...',
      shortcut: 'Ctrl+F',
      action: () => window.dispatchEvent(new CustomEvent('showFindReplaceDialog')),
    },
  ];

  const formatMenuItems: MenuItem[] = [
    {
      label: 'Characters...',
      shortcut: 'Ctrl+D',
      action: () => window.dispatchEvent(new CustomEvent('showCharacterDialog')),
    },
    {
      label: 'Paragraphs...',
      shortcut: 'Ctrl+M',
      action: () => window.dispatchEvent(new CustomEvent('showParagraphDesigner')),
    },
    { separator: true },
    { label: 'Style', disabled: true },
    { separator: true },
    {
      label: 'Paragraph Format',
      action: () => {
        const tag = prompt('Enter paragraph format tag:', 'Body');
        if (tag) store.applyParagraphFormat(tag);
      },
    },
  ];

  const viewMenuItems: MenuItem[] = [
    {
      label: 'Borders',
      action: () => store.toggleFrameBorders(),
    },
    {
      label: 'Grid Lines',
      action: () => store.toggleGrid(),
    },
    {
      label: 'Text Symbols',
      disabled: true,
    },
    {
      label: 'Rulers',
      disabled: true,
    },
    { separator: true },
    {
      label: 'Options...',
      disabled: true,
    },
    { separator: true },
    { label: 'Zoom In', shortcut: 'Ctrl++', action: () => store.setZoom(store.getState().zoom + 25) },
    { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => store.setZoom(store.getState().zoom - 25) },
    { label: 'Fit Page in Window', action: () => store.setZoom(75) },
    { label: '100%', action: () => store.setZoom(100) },
  ];

  const specialMenuItems: MenuItem[] = [
    { label: 'Add Disconnected Pages...', action: () => store.addPage() },
    { label: 'Delete Pages...', disabled: true },
    { separator: true },
    { label: 'Anchored Frame...', disabled: true },
    {
      label: 'Footnote',
      disabled: true,
    },
    { separator: true },
    {
      label: 'Connect Text Frames',
      action: () => {
        const frames = prompt('Enter frame IDs separated by comma (source,target):');
        if (frames) {
          const [source, target] = frames.split(',').map(s => s.trim());
          if (source && target) {
            store.connectFrames(source, target);
          }
        }
      }
    },
    {
      label: 'Disconnect Text Frame',
      action: () => {
        const frameId = store.getState().selectedFrameIds[0];
        if (frameId) {
          store.disconnectFrame(frameId);
        }
      }
    },
    {
      label: 'Autoconnect...',
      action: () => store.autoconnectFrames()
    },
    { separator: true },
    { label: 'Variable...', disabled: true },
    { label: 'Cross-Reference...', disabled: true },
    { separator: true },
    { label: 'Marker...', disabled: true },
    { label: 'Hypertext...', disabled: true },
  ];

  const graphicsMenuItems: MenuItem[] = [
    { label: 'Tools', action: () => window.dispatchEvent(new CustomEvent('toggleToolPalette')) },
    { separator: true },
    {
      label: 'Insert Image...',
      action: () => window.dispatchEvent(new CustomEvent('showImageDialog')),
    },
    { separator: true },
    { label: 'Bring to Front', disabled: true },
    { label: 'Send to Back', disabled: true },
    { separator: true },
    { label: 'Group', disabled: true },
    { label: 'Ungroup', disabled: true },
    { separator: true },
    { label: 'Object Properties...', disabled: true },
    { label: 'Runaround Properties...', disabled: true },
  ];

  const tableMenuItems: MenuItem[] = [
    {
      label: 'Insert Table...',
      action: () => {
        window.dispatchEvent(new CustomEvent('showTableDialog'));
      },
    },
    { separator: true },
    { label: 'Add Rows or Columns...', disabled: true },
    { label: 'Resize Columns...', disabled: true },
    { separator: true },
    { label: 'Straddle', disabled: true },
    { label: 'Unstraddle', disabled: true },
    { separator: true },
    { label: 'Table Designer...', disabled: true },
  ];

  return (
    <div className="fm-menu-bar">
      <Menu label="File" items={fileMenuItems} />
      <Menu label="Edit" items={editMenuItems} />
      <Menu label="Format" items={formatMenuItems} />
      <Menu label="View" items={viewMenuItems} />
      <Menu label="Special" items={specialMenuItems} />
      <Menu label="Graphics" items={graphicsMenuItems} />
      <Menu label="Table" items={tableMenuItems} />
    </div>
  );
};
