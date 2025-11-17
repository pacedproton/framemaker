// Table Renderer - renders tables visually
import React from 'react';
import type { Table, TableCell } from '../engine/TableEngine';

interface TableRendererProps {
  table: Table;
  onCellEdit?: (cellId: string) => void;
}

export const TableRenderer: React.FC<TableRendererProps> = ({ table, onCellEdit }) => {
  const tableStyle: React.CSSProperties = {
    borderCollapse: 'collapse',
    width: table.columns.reduce((sum, col) => sum + col.width, 0),
    marginLeft: table.indent,
    textAlign: table.alignment,
  };

  const getCellStyle = (cell: TableCell): React.CSSProperties => ({
    padding: `${cell.padding}px`,
    backgroundColor: cell.backgroundColor,
    borderTop: `${cell.borderTop.width}px ${cell.borderTop.style} ${cell.borderTop.color}`,
    borderBottom: `${cell.borderBottom.width}px ${cell.borderBottom.style} ${cell.borderBottom.color}`,
    borderLeft: `${cell.borderLeft.width}px ${cell.borderLeft.style} ${cell.borderLeft.color}`,
    borderRight: `${cell.borderRight.width}px ${cell.borderRight.style} ${cell.borderRight.color}`,
    verticalAlign: cell.verticalAlign,
    minWidth: table.columns[cell.colIndex]?.width || 50,
  });

  // Organize cells by row
  const rowCount = table.rows.length;
  const colCount = table.columns.length;
  const cellGrid: (TableCell | null)[][] = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => null)
  );

  // Place cells in grid (handling rowspan/colspan)
  for (const cell of table.cells) {
    if (cell.rowIndex < rowCount && cell.colIndex < colCount) {
      cellGrid[cell.rowIndex][cell.colIndex] = cell;
    }
  }

  return (
    <div className="fm-table-container" style={{ marginTop: table.spaceAbove, marginBottom: table.spaceBelow }}>
      {table.title && table.titlePosition === 'above' && (
        <div className="fm-table-title" style={{ fontWeight: 'bold', marginBottom: 4 }}>
          {table.title}
        </div>
      )}

      <table className="fm-table" style={tableStyle}>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={row.id} style={{ minHeight: row.minHeight }}>
              {cellGrid[rowIndex].map((cell, colIndex) => {
                if (!cell) {
                  // Check if this cell is covered by a spanning cell
                  const isCovered = table.cells.some(
                    (c) =>
                      c.rowIndex <= rowIndex &&
                      c.rowIndex + c.rowSpan > rowIndex &&
                      c.colIndex <= colIndex &&
                      c.colIndex + c.colSpan > colIndex &&
                      !(c.rowIndex === rowIndex && c.colIndex === colIndex)
                  );
                  if (isCovered) return null;
                  return (
                    <td key={colIndex} style={{ border: '1px solid #ccc', padding: 4 }}>
                      &nbsp;
                    </td>
                  );
                }

                return (
                  <td
                    key={cell.id}
                    rowSpan={cell.rowSpan}
                    colSpan={cell.colSpan}
                    style={getCellStyle(cell)}
                    onClick={() => onCellEdit?.(cell.id)}
                  >
                    {cell.paragraphs.map((para) => (
                      <div key={para.id} className="fm-table-cell-para">
                        {para.content.map((elem) => {
                          if ('text' in elem) {
                            return <span key={elem.id}>{elem.text || '\u00A0'}</span>;
                          }
                          return null;
                        })}
                      </div>
                    ))}
                    {cell.paragraphs.length === 0 && '\u00A0'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {table.title && table.titlePosition === 'below' && (
        <div className="fm-table-title" style={{ fontWeight: 'bold', marginTop: 4 }}>
          {table.title}
        </div>
      )}
    </div>
  );
};

// Compact table preview for insertion dialog
export const TablePreview: React.FC<{ rows: number; cols: number }> = ({ rows, cols }) => {
  return (
    <div className="fm-table-preview">
      <table style={{ borderCollapse: 'collapse', margin: '8px 0' }}>
        <tbody>
          {Array.from({ length: Math.min(rows, 5) }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: Math.min(cols, 5) }).map((_, c) => (
                <td
                  key={c}
                  style={{
                    border: '1px solid #808080',
                    width: 24,
                    height: 16,
                    backgroundColor: r === 0 ? '#e0e0e0' : 'white',
                  }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 10, color: '#666' }}>
        {rows} rows x {cols} columns
      </div>
    </div>
  );
};
