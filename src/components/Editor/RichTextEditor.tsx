import React, { useCallback, useMemo } from 'react';
import { createEditor, Editor, Transforms, Element as SlateElement } from 'slate';
import type { Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import type { RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { useDocumentStore } from '../../store/documentStore';
import { v4 as uuidv4 } from 'uuid';
import type {
  HeadingElement,
  TableElement,
  ImageElement,
  ListElement,
  BlockQuoteElement,
  CodeBlockElement,
  CrossReferenceElement,
  VariableElement,
  ConditionalTextElement,
  IndexMarkerElement,
} from '../../types/document';

const withCustomElements = (editor: Editor) => {
  const { isVoid, isInline } = editor;

  editor.isVoid = (element) => {
    return element.type === 'image' || isVoid(element);
  };

  editor.isInline = (element) => {
    return (
      element.type === 'cross-reference' ||
      element.type === 'variable' ||
      element.type === 'index-marker' ||
      isInline(element)
    );
  };

  return editor;
};

const RichTextEditor: React.FC = () => {
  const { currentDocument, updateContent, pushToHistory } = useDocumentStore();

  const editor = useMemo(() => withCustomElements(withHistory(withReact(createEditor()))), []);

  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;

    switch (element.type) {
      case 'heading':
        const headingLevel = (element as HeadingElement).level;
        const headingId = (element as HeadingElement).id;
        if (headingLevel === 1) {
          return <h1 {...attributes} id={headingId} className="heading heading-1">{children}</h1>;
        } else if (headingLevel === 2) {
          return <h2 {...attributes} id={headingId} className="heading heading-2">{children}</h2>;
        } else if (headingLevel === 3) {
          return <h3 {...attributes} id={headingId} className="heading heading-3">{children}</h3>;
        } else if (headingLevel === 4) {
          return <h4 {...attributes} id={headingId} className="heading heading-4">{children}</h4>;
        } else if (headingLevel === 5) {
          return <h5 {...attributes} id={headingId} className="heading heading-5">{children}</h5>;
        } else {
          return <h6 {...attributes} id={headingId} className="heading heading-6">{children}</h6>;
        }

      case 'paragraph':
        return (
          <p {...attributes} className="paragraph">
            {children}
          </p>
        );

      case 'table':
        return (
          <div className="table-wrapper" {...attributes}>
            <table className="fm-table">
              <tbody>{children}</tbody>
            </table>
          </div>
        );

      case 'table-row':
        return <tr {...attributes}>{children}</tr>;

      case 'table-cell':
        return (
          <td
            {...attributes}
            rowSpan={element.rowSpan || 1}
            colSpan={element.colSpan || 1}
            className="table-cell"
          >
            {children}
          </td>
        );

      case 'image':
        const img = element as ImageElement;
        return (
          <div {...attributes} className="image-wrapper" contentEditable={false}>
            <img
              src={img.url}
              alt={img.alt || ''}
              style={{
                width: img.width ? `${img.width}px` : 'auto',
                height: img.height ? `${img.height}px` : 'auto',
              }}
            />
            {img.caption && <div className="image-caption">{img.caption}</div>}
            {children}
          </div>
        );

      case 'anchored-frame':
        return (
          <div
            {...attributes}
            className={`anchored-frame anchored-frame-${element.position}`}
            style={{ width: element.width, height: element.height }}
          >
            {children}
          </div>
        );

      case 'cross-reference':
        return (
          <span {...attributes} className="cross-reference" contentEditable={false}>
            <span className="cross-ref-marker">[Ref: {(element as CrossReferenceElement).targetId}]</span>
            {children}
          </span>
        );

      case 'variable':
        const varElement = element as VariableElement;
        return (
          <span {...attributes} className="variable" contentEditable={false}>
            <span className="variable-marker">&lt;{varElement.name}&gt;</span>
            {children}
          </span>
        );

      case 'index-marker':
        return (
          <span {...attributes} className="index-marker" contentEditable={false}>
            <span className="index-marker-icon">📑</span>
            {children}
          </span>
        );

      case 'conditional-text':
        const condElement = element as ConditionalTextElement;
        return (
          <span
            {...attributes}
            className="conditional-text"
            data-conditions={condElement.conditions.join(',')}
          >
            {children}
          </span>
        );

      case 'bulleted-list':
        return (
          <ul {...attributes} className="bulleted-list">
            {children}
          </ul>
        );

      case 'numbered-list':
        return (
          <ol {...attributes} className="numbered-list">
            {children}
          </ol>
        );

      case 'list-item':
        return (
          <li {...attributes} className="list-item">
            {children}
          </li>
        );

      case 'block-quote':
        return (
          <blockquote {...attributes} className="block-quote">
            {children}
          </blockquote>
        );

      case 'code-block':
        return (
          <pre {...attributes} className="code-block">
            <code>{children}</code>
          </pre>
        );

      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props;
    let formattedChildren = children;

    if (leaf.bold) {
      formattedChildren = <strong>{formattedChildren}</strong>;
    }
    if (leaf.italic) {
      formattedChildren = <em>{formattedChildren}</em>;
    }
    if (leaf.underline) {
      formattedChildren = <u>{formattedChildren}</u>;
    }
    if (leaf.strikethrough) {
      formattedChildren = <s>{formattedChildren}</s>;
    }
    if (leaf.superscript) {
      formattedChildren = <sup>{formattedChildren}</sup>;
    }
    if (leaf.subscript) {
      formattedChildren = <sub>{formattedChildren}</sub>;
    }
    if (leaf.code) {
      formattedChildren = <code className="inline-code">{formattedChildren}</code>;
    }

    const style: React.CSSProperties = {};
    if (leaf.color) {
      style.color = leaf.color;
    }
    if (leaf.backgroundColor) {
      style.backgroundColor = leaf.backgroundColor;
    }
    if (leaf.fontSize) {
      style.fontSize = `${leaf.fontSize}pt`;
    }
    if (leaf.fontFamily) {
      style.fontFamily = leaf.fontFamily;
    }

    return (
      <span {...attributes} style={style}>
        {formattedChildren}
      </span>
    );
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            toggleMark(editor, 'bold');
            break;
          case 'i':
            event.preventDefault();
            toggleMark(editor, 'italic');
            break;
          case 'u':
            event.preventDefault();
            toggleMark(editor, 'underline');
            break;
          case '`':
            event.preventDefault();
            toggleMark(editor, 'code');
            break;
          case '1':
            if (event.shiftKey) {
              event.preventDefault();
              insertHeading(editor, 1);
            }
            break;
          case '2':
            if (event.shiftKey) {
              event.preventDefault();
              insertHeading(editor, 2);
            }
            break;
          case '3':
            if (event.shiftKey) {
              event.preventDefault();
              insertHeading(editor, 3);
            }
            break;
        }
      }
    },
    [editor]
  );

  const handleChange = useCallback(
    (value: Descendant[]) => {
      const isAstChange = editor.operations.some((op) => op.type !== 'set_selection');
      if (isAstChange) {
        updateContent(value);
        pushToHistory(value);
      }
    },
    [editor, updateContent, pushToHistory]
  );

  if (!currentDocument) {
    return (
      <div className="no-document">
        <p>No document open. Create a new document or open an existing one.</p>
      </div>
    );
  }

  return (
    <div className="rich-text-editor">
      <Slate editor={editor} initialValue={currentDocument.content} onChange={handleChange}>
        <Editable
          className="editor-content"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
          placeholder="Start typing your document..."
          spellCheck
          autoFocus
        />
      </Slate>
    </div>
  );
};

// Helper functions
const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format as keyof typeof marks] === true : false;
};

const insertHeading = (editor: Editor, level: 1 | 2 | 3 | 4 | 5 | 6) => {
  const heading: HeadingElement = {
    type: 'heading',
    level,
    id: uuidv4(),
    children: [{ text: '' }],
  };
  Transforms.setNodes(editor, heading);
};

export const insertTable = (editor: Editor, rows: number, cols: number) => {
  const tableRows = Array.from({ length: rows }, () => ({
    type: 'table-row' as const,
    children: Array.from({ length: cols }, () => ({
      type: 'table-cell' as const,
      children: [{ type: 'paragraph' as const, children: [{ text: '' }] }],
    })),
  }));

  const table: TableElement = {
    type: 'table',
    id: uuidv4(),
    rows,
    cols,
    children: tableRows,
  };

  Transforms.insertNodes(editor, table);
};

export const insertImage = (editor: Editor, url: string, alt?: string) => {
  const image: ImageElement = {
    type: 'image',
    id: uuidv4(),
    url,
    alt,
    children: [{ text: '' }],
  };
  Transforms.insertNodes(editor, image);
};

export const insertVariable = (editor: Editor, name: string) => {
  const variable: VariableElement = {
    type: 'variable',
    name,
    children: [{ text: '' }],
  };
  Transforms.insertNodes(editor, variable);
};

export const insertCrossReference = (editor: Editor, targetId: string, format: 'page' | 'title' | 'number' | 'full') => {
  const crossRef: CrossReferenceElement = {
    type: 'cross-reference',
    targetId,
    format,
    children: [{ text: '' }],
  };
  Transforms.insertNodes(editor, crossRef);
};

export const insertIndexMarker = (editor: Editor, terms: string[]) => {
  const marker: IndexMarkerElement = {
    type: 'index-marker',
    terms,
    children: [{ text: '' }],
  };
  Transforms.insertNodes(editor, marker);
};

export const toggleList = (editor: Editor, listType: 'bulleted-list' | 'numbered-list') => {
  const isActive = isBlockActive(editor, listType);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      (n.type === 'bulleted-list' || n.type === 'numbered-list'),
    split: true,
  });

  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : 'list-item',
  };
  Transforms.setNodes(editor, newProperties);

  if (!isActive) {
    const block: ListElement = { type: listType, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

export const toggleBlockQuote = (editor: Editor) => {
  const isActive = isBlockActive(editor, 'block-quote');

  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'block-quote',
    split: true,
  });

  if (!isActive) {
    const block: BlockQuoteElement = { type: 'block-quote', children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

export const toggleCodeBlock = (editor: Editor) => {
  const isActive = isBlockActive(editor, 'code-block');
  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : 'code-block',
  } as Partial<CodeBlockElement>);
};

const isBlockActive = (editor: Editor, format: string) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  );

  return !!match;
};

export default RichTextEditor;
