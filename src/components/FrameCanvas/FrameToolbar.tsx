import React from 'react';
import { useFrameStore } from '../../store/frameStore';
import {
  MousePointer2,
  Type,
  Image,
  Square,
  Move,
  Trash2,
  Copy,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Link,
  Unlink,
  Lock,
  Unlock,
  Grid3X3,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

const FrameToolbar: React.FC = () => {
  const {
    tool,
    setTool,
    selectedFrameId,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    zoom,
    setZoom,
    removeFrame,
    duplicateFrame,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    getSelectedFrame,
    updateFrame,
    disconnectFrame,
  } = useFrameStore();

  const selectedFrame = getSelectedFrame();

  const handleZoomIn = () => setZoom(zoom + 25);
  const handleZoomOut = () => setZoom(zoom - 25);

  return (
    <div className="frame-toolbar">
      <div className="frame-toolbar-group">
        <button
          className={`frame-tool-button ${tool === 'select' ? 'active' : ''}`}
          onClick={() => setTool('select')}
          title="Select Tool (V)"
        >
          <MousePointer2 size={18} />
        </button>
        <button
          className={`frame-tool-button ${tool === 'text-frame' ? 'active' : ''}`}
          onClick={() => setTool('text-frame')}
          title="Draw Text Frame (T)"
        >
          <Type size={18} />
        </button>
        <button
          className={`frame-tool-button ${tool === 'graphic-frame' ? 'active' : ''}`}
          onClick={() => setTool('graphic-frame')}
          title="Draw Graphic Frame (G)"
        >
          <Image size={18} />
        </button>
        <button
          className={`frame-tool-button ${tool === 'unanchored-frame' ? 'active' : ''}`}
          onClick={() => setTool('unanchored-frame')}
          title="Draw Unanchored Frame (U)"
        >
          <Square size={18} />
        </button>
        <button
          className={`frame-tool-button ${tool === 'pan' ? 'active' : ''}`}
          onClick={() => setTool('pan')}
          title="Pan Tool (H)"
        >
          <Move size={18} />
        </button>
      </div>

      <div className="frame-toolbar-separator" />

      <div className="frame-toolbar-group">
        <button
          className="frame-tool-button"
          onClick={() => selectedFrameId && duplicateFrame(selectedFrameId)}
          disabled={!selectedFrameId}
          title="Duplicate Frame"
        >
          <Copy size={18} />
        </button>
        <button
          className="frame-tool-button"
          onClick={() => selectedFrameId && removeFrame(selectedFrameId)}
          disabled={!selectedFrameId}
          title="Delete Frame"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="frame-toolbar-separator" />

      <div className="frame-toolbar-group">
        <button
          className="frame-tool-button"
          onClick={() => selectedFrameId && bringToFront(selectedFrameId)}
          disabled={!selectedFrameId}
          title="Bring to Front"
        >
          <ArrowUpToLine size={18} />
        </button>
        <button
          className="frame-tool-button"
          onClick={() => selectedFrameId && bringForward(selectedFrameId)}
          disabled={!selectedFrameId}
          title="Bring Forward"
        >
          <ArrowUp size={18} />
        </button>
        <button
          className="frame-tool-button"
          onClick={() => selectedFrameId && sendBackward(selectedFrameId)}
          disabled={!selectedFrameId}
          title="Send Backward"
        >
          <ArrowDown size={18} />
        </button>
        <button
          className="frame-tool-button"
          onClick={() => selectedFrameId && sendToBack(selectedFrameId)}
          disabled={!selectedFrameId}
          title="Send to Back"
        >
          <ArrowDownToLine size={18} />
        </button>
      </div>

      <div className="frame-toolbar-separator" />

      <div className="frame-toolbar-group">
        <button
          className="frame-tool-button"
          onClick={() => {
            if (selectedFrame && selectedFrame.type === 'text') {
              // TODO: Implement frame linking UI
              alert('Click on another text frame to link text flow');
            }
          }}
          disabled={!selectedFrame || selectedFrame.type !== 'text'}
          title="Link Text Frames"
        >
          <Link size={18} />
        </button>
        <button
          className="frame-tool-button"
          onClick={() => selectedFrameId && disconnectFrame(selectedFrameId)}
          disabled={!selectedFrame || !selectedFrame.nextFrameId}
          title="Unlink Text Frames"
        >
          <Unlink size={18} />
        </button>
      </div>

      <div className="frame-toolbar-separator" />

      <div className="frame-toolbar-group">
        <button
          className="frame-tool-button"
          onClick={() => {
            if (selectedFrameId && selectedFrame) {
              updateFrame(selectedFrameId, { locked: !selectedFrame.locked });
            }
          }}
          disabled={!selectedFrameId}
          title={selectedFrame?.locked ? 'Unlock Frame' : 'Lock Frame'}
        >
          {selectedFrame?.locked ? <Lock size={18} /> : <Unlock size={18} />}
        </button>
      </div>

      <div className="frame-toolbar-separator" />

      <div className="frame-toolbar-group">
        <button className="frame-tool-button" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={18} />
        </button>
        <span className="frame-tool-label">{zoom}%</span>
        <button className="frame-tool-button" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={18} />
        </button>
      </div>

      <div className="grid-controls">
        <label>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          <Grid3X3 size={14} />
          Grid
        </label>
        <label>
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
          />
          Snap
        </label>
        <label>
          Size:
          <input
            type="number"
            value={gridSize}
            onChange={(e) => setGridSize(parseInt(e.target.value) || 12)}
            min={4}
            max={100}
          />
        </label>
      </div>
    </div>
  );
};

export default FrameToolbar;
