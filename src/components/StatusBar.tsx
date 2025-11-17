import React from 'react';
import { useDocumentStore } from '../store/documentStore';
import { FileText, Clock, Zap, BookOpen } from 'lucide-react';

const StatusBar: React.FC = () => {
  const { currentDocument, zoom, viewMode, documentStructure, currentBook } = useDocumentStore();

  if (!currentDocument) {
    return (
      <div className="status-bar">
        <div className="status-section">
          <span className="status-item">No document open</span>
        </div>
      </div>
    );
  }

  const wordCount = countWords(currentDocument.content);
  const charCount = countCharacters(currentDocument.content);
  const pageEstimate = Math.ceil(wordCount / 500); // Rough estimate: 500 words per page

  return (
    <div className="status-bar">
      <div className="status-section left">
        <span className="status-item">
          <FileText size={14} />
          {currentDocument.name}
        </span>
        {currentBook && (
          <span className="status-item">
            <BookOpen size={14} />
            Book: {currentBook.name}
          </span>
        )}
      </div>

      <div className="status-section center">
        <span className="status-item">
          Page {pageEstimate} of ~{pageEstimate}
        </span>
        <span className="status-item">{wordCount} words</span>
        <span className="status-item">{charCount} characters</span>
        <span className="status-item">{documentStructure.length} sections</span>
      </div>

      <div className="status-section right">
        <span className="status-item">
          <Clock size={14} />
          Modified: {formatDate(currentDocument.modified)}
        </span>
        <span className="status-item">
          <Zap size={14} />
          {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
        </span>
        <span className="status-item zoom">{zoom}%</span>
      </div>
    </div>
  );
};

const countWords = (content: any[]): number => {
  let text = '';
  const extractText = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (typeof node.text === 'string') {
        text += node.text + ' ';
      } else if (node.children) {
        extractText(node.children);
      }
    });
  };
  extractText(content);
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const countCharacters = (content: any[]): number => {
  let text = '';
  const extractText = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (typeof node.text === 'string') {
        text += node.text;
      } else if (node.children) {
        extractText(node.children);
      }
    });
  };
  extractText(content);
  return text.length;
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString();
};

export default StatusBar;
