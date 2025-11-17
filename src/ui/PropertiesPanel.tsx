// Properties Panel - Document and frame properties
import React from 'react';
import { store, useStore } from '../document/store';

export const PropertiesPanel: React.FC = () => {
  const state = useStore();

  const selectedFrame = state.selectedFrameIds.length === 1
    ? store.getFrame(state.selectedFrameIds[0])
    : null;

  return (
    <div className="fm-properties-panel">
      <div className="panel-header">
        <span className="panel-title">Properties</span>
        <button className="panel-close">×</button>
      </div>

      <div className="panel-content">
        {/* Document Properties */}
        <div className="prop-section">
          <div className="prop-section-header">Document</div>
          <div className="prop-row">
            <label>Name:</label>
            <input type="text" value={state.document.name} readOnly className="prop-input" />
          </div>
          <div className="prop-row">
            <label>Pages:</label>
            <span className="prop-value">{state.document.pages.length}</span>
          </div>
          <div className="prop-row">
            <label>Size:</label>
            <span className="prop-value">
              {state.document.pageSize.width}pt × {state.document.pageSize.height}pt
            </span>
          </div>
        </div>

        {/* Frame Properties */}
        {selectedFrame && (
          <div className="prop-section">
            <div className="prop-section-header">Selected Frame</div>
            <div className="prop-row">
              <label>Type:</label>
              <span className="prop-value">{selectedFrame.type}</span>
            </div>
            <div className="prop-row">
              <label>Position:</label>
              <div className="prop-coords">
                <input
                  type="number"
                  value={Math.round(selectedFrame.x)}
                  onChange={(e) => store.moveFrame(selectedFrame.id, parseInt(e.target.value) || 0, selectedFrame.y)}
                  className="prop-input small"
                />
                <span>,</span>
                <input
                  type="number"
                  value={Math.round(selectedFrame.y)}
                  onChange={(e) => store.moveFrame(selectedFrame.id, selectedFrame.x, parseInt(e.target.value) || 0)}
                  className="prop-input small"
                />
              </div>
            </div>
            <div className="prop-row">
              <label>Size:</label>
              <div className="prop-coords">
                <input
                  type="number"
                  value={Math.round(selectedFrame.width)}
                  onChange={(e) => store.resizeFrame(selectedFrame.id, parseInt(e.target.value) || 50, selectedFrame.height)}
                  className="prop-input small"
                />
                <span>×</span>
                <input
                  type="number"
                  value={Math.round(selectedFrame.height)}
                  onChange={(e) => store.resizeFrame(selectedFrame.id, selectedFrame.width, parseInt(e.target.value) || 50)}
                  className="prop-input small"
                />
              </div>
            </div>
            <div className="prop-row">
              <label>Rotation:</label>
              <input
                type="number"
                value={selectedFrame.rotation}
                className="prop-input small"
                readOnly
              />
              <span>°</span>
            </div>
            <div className="prop-row">
              <label>Locked:</label>
              <input type="checkbox" checked={selectedFrame.locked} readOnly />
            </div>
          </div>
        )}

        {/* View Settings */}
        <div className="prop-section">
          <div className="prop-section-header">View</div>
          <div className="prop-row">
            <label>Zoom:</label>
            <div className="zoom-control">
              <button onClick={() => store.setZoom(state.zoom - 25)}>−</button>
              <span className="zoom-value">{state.zoom}%</span>
              <button onClick={() => store.setZoom(state.zoom + 25)}>+</button>
            </div>
          </div>
          <div className="prop-row checkbox">
            <input
              type="checkbox"
              id="showGrid"
              checked={state.showGrid}
              onChange={() => store.toggleGrid()}
            />
            <label htmlFor="showGrid">Show Grid</label>
          </div>
          <div className="prop-row checkbox">
            <input
              type="checkbox"
              id="showMargins"
              checked={state.showMargins}
              onChange={() => store.toggleMargins()}
            />
            <label htmlFor="showMargins">Show Margins</label>
          </div>
          <div className="prop-row checkbox">
            <input
              type="checkbox"
              id="showBorders"
              checked={state.showFrameBorders}
              onChange={() => store.toggleFrameBorders()}
            />
            <label htmlFor="showBorders">Show Frame Borders</label>
          </div>
        </div>
      </div>
    </div>
  );
};
