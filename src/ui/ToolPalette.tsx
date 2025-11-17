// Floating Tool Palette - like FrameMaker's Tools window
import React, { useState, useRef, useEffect } from 'react';
import { store, useStore } from '../document/store';

interface ToolPaletteProps {
  visible: boolean;
  onClose: () => void;
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({ visible, onClose }) => {
  const state = useStore();
  const [position, setPosition] = useState({ x: 100, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  if (!visible) return null;

  const tools = [
    { id: 'select', label: 'S', title: 'Smart Select', icon: '↖' },
    { id: 'text', label: 'T', title: 'Text', icon: 'T' },
    { id: 'textFrame', label: 'F', title: 'Text Frame', icon: '▭' },
    { id: 'line', label: 'L', title: 'Line', icon: '/' },
    { id: 'rect', label: 'R', title: 'Rectangle', icon: '□' },
    { id: 'oval', label: 'O', title: 'Oval', icon: '○' },
    { id: 'polygon', label: 'P', title: 'Polygon', icon: '⬡' },
    { id: 'polyline', label: 'Y', title: 'Polyline', icon: '⌇' },
    { id: 'arc', label: 'A', title: 'Arc', icon: '⌒' },
    { id: 'freehand', label: 'H', title: 'Freehand', icon: '✎' },
  ];

  return (
    <div
      ref={paletteRef}
      className="fm-tool-palette"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10000,
      }}
    >
      <div className="palette-title" onMouseDown={handleTitleMouseDown}>
        <span>Tools</span>
        <button className="palette-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="palette-content">
        <div className="tool-grid">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`palette-tool ${state.activeTool === tool.id ? 'active' : ''}`}
              title={`${tool.title} (${tool.label})`}
              onClick={() => store.setActiveTool(tool.id as typeof state.activeTool)}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className="tool-section">
          <div className="section-label">Properties</div>
          <div className="property-row">
            <label>Fill:</label>
            <input type="color" defaultValue="#ffffff" />
          </div>
          <div className="property-row">
            <label>Pen:</label>
            <input type="color" defaultValue="#000000" />
          </div>
          <div className="property-row">
            <label>Width:</label>
            <select defaultValue="1">
              <option value="0.5">0.5 pt</option>
              <option value="1">1 pt</option>
              <option value="2">2 pt</option>
              <option value="4">4 pt</option>
            </select>
          </div>
        </div>

        <div className="tool-section">
          <div className="section-label">Snap</div>
          <label className="checkbox-row">
            <input type="checkbox" defaultChecked />
            Grid
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            Guides
          </label>
        </div>
      </div>
    </div>
  );
};
