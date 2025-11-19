// Properties Panel - Document and frame properties
import React from 'react';
import { store, useStore } from '../document/store';
import type { GraphicFrame } from '../document/types';

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
              <label>Z-Index:</label>
              <input
                type="number"
                value={selectedFrame.zIndex}
                onChange={(e) => store.updateFrameProperty(selectedFrame.id, 'zIndex', parseInt(e.target.value) || 0)}
                className="prop-input small"
              />
            </div>
          </div>
        )}

        {/* Appearance Section */}
        {selectedFrame && (
          <div className="prop-section">
            <div className="prop-section-header">Appearance</div>
            <div className="prop-row">
              <label>Stroke Color:</label>
              <input
                type="color"
                value={selectedFrame.strokeColor}
                onChange={(e) => store.updateFrameProperty(selectedFrame.id, 'strokeColor', e.target.value)}
                className="prop-color"
              />
              <input
                type="text"
                value={selectedFrame.strokeColor}
                onChange={(e) => store.updateFrameProperty(selectedFrame.id, 'strokeColor', e.target.value)}
                className="prop-input small"
                placeholder="#000000"
              />
            </div>
            <div className="prop-row">
              <label>Stroke Width:</label>
              <input
                type="number"
                value={selectedFrame.strokeWidth}
                onChange={(e) => store.updateFrameProperty(selectedFrame.id, 'strokeWidth', parseFloat(e.target.value) || 1)}
                className="prop-input small"
                min="0"
                step="0.5"
              />
              <span>pt</span>
            </div>
            <div className="prop-row">
              <label>Fill Color:</label>
              <input
                type="color"
                value={selectedFrame.fillColor === 'transparent' ? '#ffffff' : selectedFrame.fillColor}
                onChange={(e) => store.updateFrameProperty(selectedFrame.id, 'fillColor', e.target.value)}
                className="prop-color"
              />
              <input
                type="text"
                value={selectedFrame.fillColor}
                onChange={(e) => store.updateFrameProperty(selectedFrame.id, 'fillColor', e.target.value)}
                className="prop-input small"
                placeholder="transparent"
              />
            </div>
            {selectedFrame.type === 'graphic' && (
              <div className="prop-row">
                <label>Line Style:</label>
                <select
                  value={(selectedFrame as GraphicFrame).lineStyle}
                  onChange={(e) => store.updateFrameProperty(selectedFrame.id, 'lineStyle', e.target.value)}
                  className="prop-select"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Runaround Properties */}
        {selectedFrame && selectedFrame.type !== 'text' && (
          <div className="prop-section">
            <div className="prop-section-header">Text Runaround</div>
            <div className="prop-row">
              <label>Type:</label>
              <select
                value={selectedFrame.runaround.type}
                onChange={(e) => store.updateFrameProperty(
                  selectedFrame.id,
                  'runaround',
                  { ...selectedFrame.runaround, type: e.target.value }
                )}
                className="prop-select"
              >
                <option value="none">None</option>
                <option value="bothSides">Both Sides</option>
                <option value="leftSide">Left Side Only</option>
                <option value="rightSide">Right Side Only</option>
                <option value="runInto">Run Into Frame</option>
              </select>
            </div>
            <div className="prop-row">
              <label>Gap:</label>
              <input
                type="number"
                value={selectedFrame.runaround.gap}
                onChange={(e) => store.updateFrameProperty(
                  selectedFrame.id,
                  'runaround',
                  { ...selectedFrame.runaround, gap: parseFloat(e.target.value) || 0 }
                )}
                className="prop-input small"
                min="0"
                step="1"
              />
              <span>pt</span>
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
