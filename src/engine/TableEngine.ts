// Table Engine - handles table layout and rendering
import type { Paragraph } from '../document/types';
import { createParagraph } from '../document/factory';
import { generateId } from '../document/types';

export interface TableCell {
  id: string;
  rowIndex: number;
  colIndex: number;
  rowSpan: number;
  colSpan: number;
  paragraphs: Paragraph[];
  backgroundColor: string;
  borderTop: CellBorder;
  borderBottom: CellBorder;
  borderLeft: CellBorder;
  borderRight: CellBorder;
  verticalAlign: 'top' | 'middle' | 'bottom';
  padding: number;
}

export interface CellBorder {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  color: string;
}

export interface TableRow {
  id: string;
  height: number | 'auto';
  minHeight: number;
  maxHeight: number;
  keepTogether: boolean;
}

export interface TableColumn {
  id: string;
  width: number;
}

export interface Table {
  id: string;
  rows: TableRow[];
  columns: TableColumn[];
  cells: TableCell[];

  // Table properties
  title?: string;
  titlePosition: 'above' | 'below' | 'none';
  indent: number;
  alignment: 'left' | 'center' | 'right';
  spaceAbove: number;
  spaceBelow: number;

  // Default cell properties
  defaultCellPadding: number;
  defaultBorder: CellBorder;

  // Ruling properties
  outerBorderWidth: number;
  innerRowBorderWidth: number;
  innerColBorderWidth: number;
  headerRowSeparator: CellBorder;
  footerRowSeparator: CellBorder;

  // Header/Footer
  headerRows: number;
  footerRows: number;
  repeatHeaderOnNewPage: boolean;
}

// Create a new table
export function createTable(rows: number, cols: number, width: number = 468): Table {
  const colWidth = width / cols;
  const columns: TableColumn[] = [];
  const rowDefs: TableRow[] = [];
  const cells: TableCell[] = [];

  // Create columns
  for (let c = 0; c < cols; c++) {
    columns.push({
      id: generateId('col'),
      width: colWidth,
    });
  }

  // Create rows
  for (let r = 0; r < rows; r++) {
    rowDefs.push({
      id: generateId('row'),
      height: 'auto',
      minHeight: 24,
      maxHeight: 1000,
      keepTogether: true,
    });
  }

  // Create cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(createTableCell(r, c));
    }
  }

  return {
    id: generateId('table'),
    rows: rowDefs,
    columns,
    cells,
    titlePosition: 'none',
    indent: 0,
    alignment: 'left',
    spaceAbove: 12,
    spaceBelow: 12,
    defaultCellPadding: 6,
    defaultBorder: {
      width: 1,
      style: 'solid',
      color: '#000000',
    },
    outerBorderWidth: 1,
    innerRowBorderWidth: 0.5,
    innerColBorderWidth: 0.5,
    headerRowSeparator: {
      width: 2,
      style: 'solid',
      color: '#000000',
    },
    footerRowSeparator: {
      width: 1,
      style: 'solid',
      color: '#000000',
    },
    headerRows: 0,
    footerRows: 0,
    repeatHeaderOnNewPage: true,
  };
}

// Create a table cell
export function createTableCell(rowIndex: number, colIndex: number): TableCell {
  const defaultBorder: CellBorder = {
    width: 1,
    style: 'solid',
    color: '#000000',
  };

  return {
    id: generateId('cell'),
    rowIndex,
    colIndex,
    rowSpan: 1,
    colSpan: 1,
    paragraphs: [createParagraph('')],
    backgroundColor: 'transparent',
    borderTop: { ...defaultBorder },
    borderBottom: { ...defaultBorder },
    borderLeft: { ...defaultBorder },
    borderRight: { ...defaultBorder },
    verticalAlign: 'top',
    padding: 6,
  };
}

// Get cell at position
export function getCell(table: Table, row: number, col: number): TableCell | null {
  return table.cells.find((cell) => cell.rowIndex === row && cell.colIndex === col) || null;
}

// Add row to table
export function addRow(table: Table, position: number = -1): Table {
  const insertPos = position === -1 ? table.rows.length : position;

  // Add row definition
  const newRow: TableRow = {
    id: generateId('row'),
    height: 'auto',
    minHeight: 24,
    maxHeight: 1000,
    keepTogether: true,
  };

  const newRows = [...table.rows];
  newRows.splice(insertPos, 0, newRow);

  // Update row indices for existing cells
  const updatedCells = table.cells.map((cell) => {
    if (cell.rowIndex >= insertPos) {
      return { ...cell, rowIndex: cell.rowIndex + 1 };
    }
    return cell;
  });

  // Add new cells for the row
  const newCells: TableCell[] = [];
  for (let c = 0; c < table.columns.length; c++) {
    newCells.push(createTableCell(insertPos, c));
  }

  return {
    ...table,
    rows: newRows,
    cells: [...updatedCells, ...newCells],
  };
}

// Add column to table
export function addColumn(table: Table, position: number = -1, width: number = 72): Table {
  const insertPos = position === -1 ? table.columns.length : position;

  // Add column definition
  const newColumn: TableColumn = {
    id: generateId('col'),
    width,
  };

  const newColumns = [...table.columns];
  newColumns.splice(insertPos, 0, newColumn);

  // Update column indices for existing cells
  const updatedCells = table.cells.map((cell) => {
    if (cell.colIndex >= insertPos) {
      return { ...cell, colIndex: cell.colIndex + 1 };
    }
    return cell;
  });

  // Add new cells for the column
  const newCells: TableCell[] = [];
  for (let r = 0; r < table.rows.length; r++) {
    newCells.push(createTableCell(r, insertPos));
  }

  return {
    ...table,
    columns: newColumns,
    cells: [...updatedCells, ...newCells],
  };
}

// Remove row from table
export function removeRow(table: Table, rowIndex: number): Table {
  if (table.rows.length <= 1) {
    return table; // Cannot remove last row
  }

  const newRows = table.rows.filter((_, i) => i !== rowIndex);

  // Remove cells in row and update indices
  const newCells = table.cells
    .filter((cell) => cell.rowIndex !== rowIndex)
    .map((cell) => {
      if (cell.rowIndex > rowIndex) {
        return { ...cell, rowIndex: cell.rowIndex - 1 };
      }
      return cell;
    });

  return {
    ...table,
    rows: newRows,
    cells: newCells,
  };
}

// Remove column from table
export function removeColumn(table: Table, colIndex: number): Table {
  if (table.columns.length <= 1) {
    return table; // Cannot remove last column
  }

  const newColumns = table.columns.filter((_, i) => i !== colIndex);

  // Remove cells in column and update indices
  const newCells = table.cells
    .filter((cell) => cell.colIndex !== colIndex)
    .map((cell) => {
      if (cell.colIndex > colIndex) {
        return { ...cell, colIndex: cell.colIndex - 1 };
      }
      return cell;
    });

  return {
    ...table,
    columns: newColumns,
    cells: newCells,
  };
}

// Straddle cells (merge)
export function straddleCells(
  table: Table,
  startRow: number,
  startCol: number,
  rowSpan: number,
  colSpan: number
): Table {
  const primaryCell = getCell(table, startRow, startCol);
  if (!primaryCell) return table;

  // Update primary cell
  const updatedCells = table.cells.map((cell) => {
    if (cell.id === primaryCell.id) {
      return { ...cell, rowSpan, colSpan };
    }

    // Remove cells that are covered by the straddle
    if (
      cell.rowIndex >= startRow &&
      cell.rowIndex < startRow + rowSpan &&
      cell.colIndex >= startCol &&
      cell.colIndex < startCol + colSpan &&
      cell.id !== primaryCell.id
    ) {
      // Mark for removal (we'll filter these out)
      return { ...cell, rowSpan: 0, colSpan: 0 };
    }

    return cell;
  });

  return {
    ...table,
    cells: updatedCells.filter((cell) => cell.rowSpan > 0 && cell.colSpan > 0),
  };
}

// Unstraddle cells (split)
export function unstraddleCells(table: Table, cellId: string): Table {
  const cell = table.cells.find((c) => c.id === cellId);
  if (!cell || (cell.rowSpan === 1 && cell.colSpan === 1)) return table;

  const newCells: TableCell[] = [];

  // Reset the primary cell
  const updatedCells = table.cells.map((c) => {
    if (c.id === cellId) {
      return { ...c, rowSpan: 1, colSpan: 1 };
    }
    return c;
  });

  // Add back the individual cells
  for (let r = 0; r < cell.rowSpan; r++) {
    for (let c = 0; c < cell.colSpan; c++) {
      if (r === 0 && c === 0) continue; // Skip primary cell
      newCells.push(createTableCell(cell.rowIndex + r, cell.colIndex + c));
    }
  }

  return {
    ...table,
    cells: [...updatedCells, ...newCells],
  };
}

// Calculate table dimensions
export function calculateTableSize(table: Table): { width: number; height: number } {
  const width = table.columns.reduce((sum, col) => sum + col.width, 0);

  let height = 0;
  for (const row of table.rows) {
    if (row.height === 'auto') {
      // For auto height, use minimum
      height += row.minHeight;
    } else {
      height += row.height;
    }
  }

  return { width, height };
}

// Get cell position and size
export function getCellBounds(
  table: Table,
  cell: TableCell
): { x: number; y: number; width: number; height: number } {
  let x = 0;
  let y = 0;
  let width = 0;
  let height = 0;

  // Calculate x position
  for (let c = 0; c < cell.colIndex; c++) {
    x += table.columns[c].width;
  }

  // Calculate width (including colspan)
  for (let c = 0; c < cell.colSpan; c++) {
    if (cell.colIndex + c < table.columns.length) {
      width += table.columns[cell.colIndex + c].width;
    }
  }

  // Calculate y position
  for (let r = 0; r < cell.rowIndex; r++) {
    const row = table.rows[r];
    height = row.height === 'auto' ? row.minHeight : row.height;
    y += height;
  }

  // Calculate height (including rowspan)
  height = 0;
  for (let r = 0; r < cell.rowSpan; r++) {
    if (cell.rowIndex + r < table.rows.length) {
      const row = table.rows[cell.rowIndex + r];
      height += row.height === 'auto' ? row.minHeight : row.height;
    }
  }

  return { x, y, width, height };
}
