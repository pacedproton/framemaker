// Table Insertion Dialog
import React, { useState } from 'react';
import { TablePreview } from '../render/TableRenderer';

interface TableDialogProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (rows: number, cols: number, title: string) => void;
}

export const TableDialog: React.FC<TableDialogProps> = ({ visible, onClose, onInsert }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [title, setTitle] = useState('');
  const [hasTitle, setHasTitle] = useState(false);
  const [headerRows, setHeaderRows] = useState(1);

  const handleInsert = () => {
    onInsert(rows, cols, hasTitle ? title : '');
    // Reset for next use
    setRows(3);
    setCols(3);
    setTitle('');
    setHasTitle(false);
  };

  if (!visible) return null;

  return (
    <div className="fm-dialog-overlay">
      <div className="fm-dialog table-dialog">
        <div className="dialog-title">Insert Table</div>

        <div className="dialog-content">
          <div className="table-size-inputs">
            <div className="property-row">
              <label>Rows:</label>
              <input
                type="number"
                min={1}
                max={100}
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="property-row">
              <label>Columns:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="property-row">
              <label>Header Rows:</label>
              <input
                type="number"
                min={0}
                max={rows}
                value={headerRows}
                onChange={(e) => setHeaderRows(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="table-preview-section">
            <div className="section-label">Preview:</div>
            <TablePreview rows={rows} cols={cols} />
          </div>

          <div className="table-title-section">
            <div className="checkbox-row">
              <input
                type="checkbox"
                id="hasTitle"
                checked={hasTitle}
                onChange={(e) => setHasTitle(e.target.checked)}
              />
              <label htmlFor="hasTitle">Include Table Title</label>
            </div>
            {hasTitle && (
              <div className="property-row">
                <label>Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Table 1: Description"
                />
              </div>
            )}
          </div>

          <div className="table-format-section">
            <div className="section-label">Format:</div>
            <div className="checkbox-row">
              <input type="checkbox" id="borders" defaultChecked />
              <label htmlFor="borders">Show borders</label>
            </div>
            <div className="checkbox-row">
              <input type="checkbox" id="shadeHeader" defaultChecked />
              <label htmlFor="shadeHeader">Shade header rows</label>
            </div>
          </div>
        </div>

        <div className="dialog-buttons">
          <button onClick={handleInsert}>Insert</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
