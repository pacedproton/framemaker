// Document statistics calculation utilities
import type { EditorState, TextFrame } from '../document/types';

export interface DocumentStats {
  totalFrames: number;
  textFrames: number;
  imageFrames: number;
  totalCharacters: number;
  charactersNoSpaces: number;
  totalWords: number;
  totalParagraphs: number;
  equations: number;
  tables: number;
}

/**
 * Count words in a text string
 */
const countWords = (text: string): number => {
  const words = text.trim().split(/\s+/);
  return words.filter((w) => w.length > 0).length;
};

/**
 * Calculate comprehensive document statistics
 */
export const calculateDocumentStats = (state: EditorState): DocumentStats => {
  const stats: DocumentStats = {
    totalFrames: 0,
    textFrames: 0,
    imageFrames: 0,
    totalCharacters: 0,
    charactersNoSpaces: 0,
    totalWords: 0,
    totalParagraphs: 0,
    equations: 0,
    tables: 0,
  };

  for (const page of state.document.pages) {
    stats.totalFrames += page.frames.length;

    for (const frame of page.frames) {
      if (frame.type === 'text') {
        stats.textFrames++;
        const textFrame = frame as TextFrame;

        for (const para of textFrame.paragraphs) {
          stats.totalParagraphs++;

          for (const element of para.content) {
            if ('text' in element && typeof element.text === 'string') {
              const text = element.text;
              stats.totalCharacters += text.length;
              stats.charactersNoSpaces += text.replace(/\s/g, '').length;
              stats.totalWords += countWords(text);
            } else if ('type' in element) {
              if (element.type === 'equation') {
                stats.equations++;
              } else if (element.type === 'table') {
                stats.tables++;
              }
            }
          }
        }
      } else if (frame.type === 'image') {
        stats.imageFrames++;
      }
    }
  }

  return stats;
};
