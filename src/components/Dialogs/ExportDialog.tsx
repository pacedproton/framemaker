import React, { useState } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import type { PDFExportOptions, HTMLExportOptions } from '../../types/document';
import { FileDown, X, FileText, Globe, Code } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportDialog: React.FC = () => {
  const { showExportDialog, toggleExportDialog, currentDocument } = useDocumentStore();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'html' | 'xml' | 'markdown'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const [pdfOptions, setPdfOptions] = useState<PDFExportOptions>({
    pageSize: 'letter',
    orientation: 'portrait',
    includeBookmarks: true,
    includeTOC: true,
    includeIndex: false,
    embedFonts: true,
    imageQuality: 'high',
  });

  const [htmlOptions, setHtmlOptions] = useState<HTMLExportOptions>({
    singleFile: true,
    includeCSS: true,
    includeImages: true,
    responsiveDesign: true,
  });

  if (!showExportDialog || !currentDocument) return null;

  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      const editorElement = document.querySelector('.editor-content');
      if (!editorElement) {
        throw new Error('Editor content not found');
      }

      const canvas = await html2canvas(editorElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: pdfOptions.orientation,
        unit: 'pt',
        format: pdfOptions.pageSize,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 72;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 36;

      pdf.addImage(imgData, 'PNG', 36, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 36, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${currentDocument.name}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again.');
    }

    setIsExporting(false);
  };

  const handleExportHTML = () => {
    setIsExporting(true);

    const htmlContent = generateHTMLDocument(currentDocument, htmlOptions);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument.name}.html`;
    a.click();
    URL.revokeObjectURL(url);

    setIsExporting(false);
  };

  const handleExportXML = () => {
    setIsExporting(true);

    const xmlContent = generateXMLDocument(currentDocument);
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument.name}.xml`;
    a.click();
    URL.revokeObjectURL(url);

    setIsExporting(false);
  };

  const handleExportMarkdown = () => {
    setIsExporting(true);

    const mdContent = generateMarkdownDocument(currentDocument);
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument.name}.md`;
    a.click();
    URL.revokeObjectURL(url);

    setIsExporting(false);
  };

  const handleExport = () => {
    switch (exportFormat) {
      case 'pdf':
        handleExportPDF();
        break;
      case 'html':
        handleExportHTML();
        break;
      case 'xml':
        handleExportXML();
        break;
      case 'markdown':
        handleExportMarkdown();
        break;
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog export-dialog">
        <div className="dialog-header">
          <h2>
            <FileDown size={20} />
            Export Document
          </h2>
          <button className="close-button" onClick={toggleExportDialog}>
            <X size={20} />
          </button>
        </div>

        <div className="dialog-content">
          <div className="export-format-selector">
            <button
              className={`format-button ${exportFormat === 'pdf' ? 'active' : ''}`}
              onClick={() => setExportFormat('pdf')}
            >
              <FileText size={24} />
              <span>PDF</span>
            </button>
            <button
              className={`format-button ${exportFormat === 'html' ? 'active' : ''}`}
              onClick={() => setExportFormat('html')}
            >
              <Globe size={24} />
              <span>HTML</span>
            </button>
            <button
              className={`format-button ${exportFormat === 'xml' ? 'active' : ''}`}
              onClick={() => setExportFormat('xml')}
            >
              <Code size={24} />
              <span>XML</span>
            </button>
            <button
              className={`format-button ${exportFormat === 'markdown' ? 'active' : ''}`}
              onClick={() => setExportFormat('markdown')}
            >
              <FileText size={24} />
              <span>Markdown</span>
            </button>
          </div>

          {exportFormat === 'pdf' && (
            <div className="export-options pdf-options">
              <h3>PDF Options</h3>
              <div className="form-group">
                <label>Page Size</label>
                <select
                  value={pdfOptions.pageSize}
                  onChange={(e) => setPdfOptions({ ...pdfOptions, pageSize: e.target.value })}
                >
                  <option value="letter">Letter (8.5" × 11")</option>
                  <option value="a4">A4 (210mm × 297mm)</option>
                  <option value="legal">Legal (8.5" × 14")</option>
                  <option value="tabloid">Tabloid (11" × 17")</option>
                </select>
              </div>
              <div className="form-group">
                <label>Orientation</label>
                <select
                  value={pdfOptions.orientation}
                  onChange={(e) =>
                    setPdfOptions({
                      ...pdfOptions,
                      orientation: e.target.value as 'portrait' | 'landscape',
                    })
                  }
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="includeBookmarks"
                  checked={pdfOptions.includeBookmarks}
                  onChange={(e) =>
                    setPdfOptions({ ...pdfOptions, includeBookmarks: e.target.checked })
                  }
                />
                <label htmlFor="includeBookmarks">Include bookmarks</label>
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="includeTOC"
                  checked={pdfOptions.includeTOC}
                  onChange={(e) => setPdfOptions({ ...pdfOptions, includeTOC: e.target.checked })}
                />
                <label htmlFor="includeTOC">Include table of contents</label>
              </div>
              <div className="form-group">
                <label>Image Quality</label>
                <select
                  value={pdfOptions.imageQuality}
                  onChange={(e) =>
                    setPdfOptions({
                      ...pdfOptions,
                      imageQuality: e.target.value as 'low' | 'medium' | 'high',
                    })
                  }
                >
                  <option value="low">Low (smaller file)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (best quality)</option>
                </select>
              </div>
            </div>
          )}

          {exportFormat === 'html' && (
            <div className="export-options html-options">
              <h3>HTML Options</h3>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="singleFile"
                  checked={htmlOptions.singleFile}
                  onChange={(e) => setHtmlOptions({ ...htmlOptions, singleFile: e.target.checked })}
                />
                <label htmlFor="singleFile">Single file (embed all resources)</label>
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="includeCSS"
                  checked={htmlOptions.includeCSS}
                  onChange={(e) => setHtmlOptions({ ...htmlOptions, includeCSS: e.target.checked })}
                />
                <label htmlFor="includeCSS">Include CSS styles</label>
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="responsiveDesign"
                  checked={htmlOptions.responsiveDesign}
                  onChange={(e) =>
                    setHtmlOptions({ ...htmlOptions, responsiveDesign: e.target.checked })
                  }
                />
                <label htmlFor="responsiveDesign">Responsive design</label>
              </div>
            </div>
          )}

          {exportFormat === 'xml' && (
            <div className="export-options xml-options">
              <h3>XML Options</h3>
              <p>Export document in structured XML format compatible with DITA standards.</p>
              <div className="form-group">
                <label>XML Schema</label>
                <select defaultValue="dita">
                  <option value="dita">DITA</option>
                  <option value="docbook">DocBook</option>
                  <option value="custom">Custom Schema</option>
                </select>
              </div>
            </div>
          )}

          {exportFormat === 'markdown' && (
            <div className="export-options markdown-options">
              <h3>Markdown Options</h3>
              <p>Export document as Markdown for use in documentation systems.</p>
              <div className="form-group">
                <label>Markdown Flavor</label>
                <select defaultValue="gfm">
                  <option value="gfm">GitHub Flavored</option>
                  <option value="commonmark">CommonMark</option>
                  <option value="multimarkdown">MultiMarkdown</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="cancel-button" onClick={toggleExportDialog}>
            Cancel
          </button>
          <button className="primary-button" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions for export
const generateHTMLDocument = (doc: any, options: HTMLExportOptions): string => {
  const contentHTML = convertContentToHTML(doc.content);

  return `<!DOCTYPE html>
<html lang="${doc.metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.metadata.title}</title>
  <meta name="author" content="${doc.metadata.author}">
  <meta name="description" content="${doc.metadata.subject}">
  ${
    options.includeCSS
      ? `
  <style>
    body {
      font-family: 'Times New Roman', serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { font-size: 24pt; margin-top: 24pt; }
    h2 { font-size: 18pt; margin-top: 18pt; }
    h3 { font-size: 14pt; margin-top: 14pt; }
    p { margin-bottom: 12pt; text-align: justify; }
    table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    th { background: #f0f0f0; }
    img { max-width: 100%; height: auto; }
    blockquote { border-left: 3px solid #ccc; padding-left: 12pt; margin: 12pt 0; }
    code { background: #f0f0f0; padding: 2px 4px; font-family: 'Courier New', monospace; }
    pre { background: #f0f0f0; padding: 12px; overflow-x: auto; }
  </style>
  `
      : ''
  }
</head>
<body>
  ${contentHTML}
</body>
</html>`;
};

const convertContentToHTML = (content: any[]): string => {
  return content
    .map((node) => {
      if (node.type === 'heading') {
        const text = node.children.map((c: any) => c.text || '').join('');
        return `<h${node.level} id="${node.id}">${text}</h${node.level}>`;
      }
      if (node.type === 'paragraph') {
        const text = node.children.map((c: any) => formatText(c)).join('');
        return `<p>${text}</p>`;
      }
      if (node.type === 'bulleted-list') {
        const items = node.children.map((item: any) => `<li>${convertContentToHTML(item.children)}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      if (node.type === 'numbered-list') {
        const items = node.children.map((item: any) => `<li>${convertContentToHTML(item.children)}</li>`).join('');
        return `<ol>${items}</ol>`;
      }
      if (node.type === 'block-quote') {
        return `<blockquote>${convertContentToHTML(node.children)}</blockquote>`;
      }
      if (node.type === 'code-block') {
        const code = node.children.map((c: any) => c.text || '').join('');
        return `<pre><code>${code}</code></pre>`;
      }
      return '';
    })
    .join('\n');
};

const formatText = (node: any): string => {
  let text = node.text || '';
  if (node.bold) text = `<strong>${text}</strong>`;
  if (node.italic) text = `<em>${text}</em>`;
  if (node.underline) text = `<u>${text}</u>`;
  if (node.strikethrough) text = `<s>${text}</s>`;
  if (node.code) text = `<code>${text}</code>`;
  if (node.superscript) text = `<sup>${text}</sup>`;
  if (node.subscript) text = `<sub>${text}</sub>`;
  return text;
};

const generateXMLDocument = (doc: any): string => {
  const contentXML = convertContentToXML(doc.content);
  return `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <metadata>
    <title>${doc.metadata.title}</title>
    <author>${doc.metadata.author}</author>
    <subject>${doc.metadata.subject}</subject>
    <language>${doc.metadata.language}</language>
    <version>${doc.metadata.version}</version>
    <created>${doc.created}</created>
    <modified>${doc.modified}</modified>
  </metadata>
  <content>
    ${contentXML}
  </content>
</document>`;
};

const convertContentToXML = (content: any[]): string => {
  return content
    .map((node) => {
      if (node.type === 'heading') {
        const text = node.children.map((c: any) => c.text || '').join('');
        return `<heading level="${node.level}" id="${node.id}">${text}</heading>`;
      }
      if (node.type === 'paragraph') {
        const text = node.children.map((c: any) => c.text || '').join('');
        return `<paragraph>${text}</paragraph>`;
      }
      return '';
    })
    .join('\n    ');
};

const generateMarkdownDocument = (doc: any): string => {
  let md = `# ${doc.metadata.title}\n\n`;
  md += `*Author: ${doc.metadata.author}*\n\n`;
  md += `---\n\n`;
  md += convertContentToMarkdown(doc.content);
  return md;
};

const convertContentToMarkdown = (content: any[]): string => {
  return content
    .map((node) => {
      if (node.type === 'heading') {
        const text = node.children.map((c: any) => c.text || '').join('');
        return `${'#'.repeat(node.level)} ${text}\n\n`;
      }
      if (node.type === 'paragraph') {
        const text = node.children.map((c: any) => formatTextMD(c)).join('');
        return `${text}\n\n`;
      }
      if (node.type === 'bulleted-list') {
        return node.children.map((item: any) => `- ${convertContentToMarkdown(item.children).trim()}`).join('\n') + '\n\n';
      }
      if (node.type === 'numbered-list') {
        return node.children.map((item: any, i: number) => `${i + 1}. ${convertContentToMarkdown(item.children).trim()}`).join('\n') + '\n\n';
      }
      if (node.type === 'block-quote') {
        return `> ${convertContentToMarkdown(node.children).trim()}\n\n`;
      }
      if (node.type === 'code-block') {
        const code = node.children.map((c: any) => c.text || '').join('');
        return `\`\`\`\n${code}\n\`\`\`\n\n`;
      }
      return '';
    })
    .join('');
};

const formatTextMD = (node: any): string => {
  let text = node.text || '';
  if (node.bold && node.italic) text = `***${text}***`;
  else if (node.bold) text = `**${text}**`;
  else if (node.italic) text = `*${text}*`;
  if (node.strikethrough) text = `~~${text}~~`;
  if (node.code) text = `\`${text}\``;
  return text;
};

export default ExportDialog;
