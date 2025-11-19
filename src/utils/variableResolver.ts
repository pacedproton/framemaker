// Variable resolver - resolves variable values based on context
import type { VariableDefinition, FMDocument } from '../document/types';

export function resolveVariableValue(
  variable: VariableDefinition,
  document: FMDocument,
  currentPageIndex: number
): string {
  switch (variable.type) {
    case 'currentPageNumber':
      return String(currentPageIndex + 1);

    case 'pageCount':
      return String(document.pages.length);

    case 'chapterNumber':
      // Simplified: use page number
      return String(currentPageIndex + 1);

    case 'chapterTitle':
      // Simplified: use document name
      return document.name;

    case 'runningHeader':
    case 'runningFooter':
      // Could be populated from first heading on page
      return variable.customValue || '';

    case 'creationDate':
      return formatDate(new Date(document.metadata.createdAt), variable.format);

    case 'modificationDate':
      return formatDate(new Date(document.metadata.modifiedAt), variable.format);

    case 'filename':
      return document.name;

    case 'author':
      return document.metadata.author || '';

    case 'custom':
      return variable.customValue || '';

    default:
      return '';
  }
}

function formatDate(date: Date, format?: string): string {
  if (!format) {
    return date.toLocaleDateString();
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  // Simple date formatting
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}
