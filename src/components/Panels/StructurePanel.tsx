import React from 'react';
import { useDocumentStore } from '../../store/documentStore';
import type { DocumentSection } from '../../types/document';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Hash,
  BookOpen,
  RefreshCw,
} from 'lucide-react';

interface TreeItemProps {
  section: DocumentSection;
  depth: number;
}

const TreeItem: React.FC<TreeItemProps> = ({ section, depth }) => {
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = section.children.length > 0;

  const handleClick = () => {
    const element = document.getElementById(section.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight');
      setTimeout(() => element.classList.remove('highlight'), 2000);
    }
  };

  return (
    <div className="tree-item">
      <div
        className="tree-item-header"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <button
            className="tree-expand-button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        {!hasChildren && <span className="tree-spacer" />}
        <span className="tree-item-icon">
          <Hash size={14} />
        </span>
        <span className="tree-item-title">{section.title}</span>
        {section.pageNumber && <span className="tree-item-page">p.{section.pageNumber}</span>}
      </div>
      {expanded && hasChildren && (
        <div className="tree-children">
          {section.children.map((child) => (
            <TreeItem key={child.id} section={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const StructurePanel: React.FC = () => {
  const { currentDocument, documentStructure, updateDocumentStructure, currentBook } =
    useDocumentStore();

  if (!currentDocument) {
    return (
      <div className="panel structure-panel">
        <div className="panel-header">
          <h3>Document Structure</h3>
        </div>
        <div className="panel-content empty">
          <p>No document open</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel structure-panel">
      <div className="panel-header">
        <h3>
          <FileText size={16} />
          Document Structure
        </h3>
        <div className="panel-actions">
          <button
            className="panel-action-button"
            onClick={updateDocumentStructure}
            title="Refresh Structure"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="panel-content">
        {currentBook && (
          <div className="book-section">
            <div className="section-header">
              <BookOpen size={14} />
              <span>Book: {currentBook.name}</span>
            </div>
            <div className="book-documents">
              {currentBook.documents.map((doc) => (
                <div key={doc.id} className="book-document-item">
                  <FileText size={12} />
                  <span>{doc.name}</span>
                  <span className="doc-type">{doc.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="structure-tree">
          <div className="section-header">
            <FileText size={14} />
            <span>{currentDocument.name}</span>
          </div>
          {documentStructure.length > 0 ? (
            documentStructure.map((section) => (
              <TreeItem key={section.id} section={section} depth={0} />
            ))
          ) : (
            <div className="no-structure">
              <p>No headings found in document.</p>
              <p>Add headings to create document structure.</p>
            </div>
          )}
        </div>

        <div className="structure-stats">
          <div className="stat-item">
            <span className="stat-label">Sections:</span>
            <span className="stat-value">{countSections(documentStructure)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Words:</span>
            <span className="stat-value">{countWords(currentDocument.content)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Characters:</span>
            <span className="stat-value">{countCharacters(currentDocument.content)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const countSections = (sections: DocumentSection[]): number => {
  let count = sections.length;
  sections.forEach((section) => {
    count += countSections(section.children);
  });
  return count;
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

export default StructurePanel;
