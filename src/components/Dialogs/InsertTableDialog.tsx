import React, { useState } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { Table, X } from 'lucide-react';

interface InsertTableDialogProps {
  onInsert: (rows: number, cols: number) => void;
}

const InsertTableDialog: React.FC<InsertTableDialogProps> = ({ onInsert }) => {
  const { showInsertTableDialog, toggleInsertTableDialog } = useDocumentStore();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hasHeader, setHasHeader] = useState(true);
  const [tableStyle, setTableStyle] = useState('basic');

  if (!showInsertTableDialog) return null;

  const handleInsert = () => {
    onInsert(rows, cols);
    toggleInsertTableDialog();
    setRows(3);
    setCols(3);
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog insert-table-dialog">
        <div className="dialog-header">
          <h2>
            <Table size={20} />
            Insert Table
          </h2>
          <button className="close-button" onClick={toggleInsertTableDialog}>
            <X size={20} />
          </button>
        </div>

        <div className="dialog-content">
          <div className="form-group">
            <label>Rows</label>
            <input
              type="number"
              min="1"
              max="100"
              value={rows}
              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="form-group">
            <label>Columns</label>
            <input
              type="number"
              min="1"
              max="20"
              value={cols}
              onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="hasHeader"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
            />
            <label htmlFor="hasHeader">Include header row</label>
          </div>

          <div className="form-group">
            <label>Table Style</label>
            <select value={tableStyle} onChange={(e) => setTableStyle(e.target.value)}>
              <option value="basic">Basic</option>
              <option value="bordered">Bordered</option>
              <option value="striped">Striped</option>
              <option value="compact">Compact</option>
            </select>
          </div>

          <div className="table-preview">
            <h4>Preview</h4>
            <div className="preview-table-container">
              <table className={`preview-table ${tableStyle}`}>
                <thead>
                  {hasHeader && (
                    <tr>
                      {Array.from({ length: Math.min(cols, 5) }).map((_, i) => (
                        <th key={i}>Header {i + 1}</th>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {Array.from({ length: Math.min(rows - (hasHeader ? 1 : 0), 3) }).map((_, rowI) => (
                    <tr key={rowI}>
                      {Array.from({ length: Math.min(cols, 5) }).map((_, colI) => (
                        <td key={colI}>Cell</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="preview-info">
              {rows} rows × {cols} columns
            </p>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="cancel-button" onClick={toggleInsertTableDialog}>
            Cancel
          </button>
          <button className="primary-button" onClick={handleInsert}>
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsertTableDialog;
