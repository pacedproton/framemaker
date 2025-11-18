// Text search utilities for Find/Replace functionality
import type { EditorState, TextFrame } from '../document/types';

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
}

/**
 * Escape special regex characters in a string
 */
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Count occurrences of search text in document
 */
export const countOccurrences = (
  text: string,
  searchText: string,
  options: SearchOptions
): number => {
  if (!searchText || !text) return 0;

  if (options.wholeWord) {
    const flags = options.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`\\b${escapeRegex(searchText)}\\b`, flags);
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  const target = options.caseSensitive ? text : text.toLowerCase();
  const search = options.caseSensitive ? searchText : searchText.toLowerCase();

  let count = 0;
  let pos = 0;
  while ((pos = target.indexOf(search, pos)) !== -1) {
    count++;
    pos += search.length;
  }

  return count;
};

/**
 * Search through all text frames in document
 */
export const searchDocument = (
  state: EditorState,
  searchText: string,
  options: SearchOptions
): number => {
  let totalCount = 0;

  for (const page of state.document.pages) {
    for (const frame of page.frames) {
      if (frame.type === 'text') {
        const textFrame = frame as TextFrame;
        for (const para of textFrame.paragraphs) {
          for (const element of para.content) {
            if ('text' in element && typeof element.text === 'string') {
              totalCount += countOccurrences(element.text, searchText, options);
            }
          }
        }
      }
    }
  }

  return totalCount;
};
