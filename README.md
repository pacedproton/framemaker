# FrameMaker Web

A fully-featured document authoring application built with modern web technologies, inspired by Adobe FrameMaker. This application provides professional-grade document creation capabilities including structured authoring, cross-references, conditional text, and multi-channel publishing.

## Features

### Rich Text Editing
- Full rich text editing with Slate.js
- Bold, italic, underline, strikethrough formatting
- Superscript and subscript support
- Code blocks and inline code
- Block quotes and lists (bulleted/numbered)
- Multiple heading levels (H1-H6)

### Document Structure
- Automatic table of contents generation
- Hierarchical document structure view
- Navigation by clicking on sections
- Word and character count statistics
- Section count tracking

### Paragraph & Character Styles
- Pre-defined paragraph styles (Body, Headings, Code, Caption)
- Character styles (Emphasis, Strong, Highlight)
- Full style editor with font, spacing, and pagination controls
- Style inheritance and next-style support
- Create, edit, duplicate, and delete styles

### Cross-References & Variables
- Document variables (title, author, date, page numbers)
- Custom user-defined variables
- Variable insertion in documents
- Cross-reference support with multiple formats

### Conditional Text
- Multiple condition tags with color coding
- Show/hide conditional content
- Single-source publishing support
- Platform and audience-specific content

### Index Generation
- Index marker insertion
- Primary and secondary terms support
- Alphabetical grouping
- Export index as separate document

### Book Management
- Multi-document book support
- Chapter organization
- Continuous or per-chapter numbering
- Book-level variables

### Master Pages & Templates
- Page size configuration (Letter, A4, Legal, etc.)
- Margin settings
- Column layouts
- Header and footer content

### Export Options
- **PDF Export**: Generate PDF with customizable options
  - Page size and orientation
  - Bookmarks and TOC inclusion
  - Image quality settings
- **HTML Export**: Single-file or multi-file output
  - Embedded CSS styles
  - Responsive design support
- **XML Export**: DITA-compatible structured output
- **Markdown Export**: GitHub Flavored Markdown

### Find & Replace
- Case-sensitive and whole-word search
- Regular expression support
- Search across document or selection
- Replace single or all occurrences
- Special character insertion

### User Interface
- Professional desktop-style interface
- Full menu bar with keyboard shortcuts
- Toolbars for quick access to features
- Side panels for structure, styles, variables, conditions, and index
- Properties panel showing document metadata
- Status bar with document statistics
- Zoom controls (25% - 400%)
- Multiple view modes (Normal, Preview, Structure)
- Responsive design for different screen sizes
- Print-optimized styling

### Keyboard Shortcuts
- **Ctrl+S**: Save document
- **Ctrl+N**: New document
- **Ctrl+H**: Find & Replace
- **Ctrl+B**: Bold
- **Ctrl+I**: Italic
- **Ctrl+U**: Underline
- **Ctrl+Shift+1/2/3**: Heading 1/2/3

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Slate.js** - Rich text editing framework
- **Zustand** - State management with Immer integration
- **Lucide React** - Icon library
- **jsPDF** - PDF generation
- **html2canvas** - HTML to canvas conversion for PDF export

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The development server runs at `http://localhost:5173` by default.

## Project Structure

```
src/
├── components/
│   ├── Editor/           # Rich text editor component
│   ├── Panels/           # Side panel components
│   │   ├── StructurePanel.tsx
│   │   ├── StylesPanel.tsx
│   │   ├── VariablesPanel.tsx
│   │   ├── ConditionsPanel.tsx
│   │   └── IndexPanel.tsx
│   ├── Toolbar/          # Toolbar components
│   ├── Dialogs/          # Modal dialog components
│   ├── MenuBar.tsx       # Application menu
│   └── StatusBar.tsx     # Bottom status bar
├── store/
│   └── documentStore.ts  # Zustand state management
├── types/
│   └── document.ts       # TypeScript type definitions
├── App.tsx               # Main application component
├── App.css               # Application styles
└── main.tsx              # Application entry point
```

## Document Format

Documents are saved in JSON format with `.fmweb` extension, containing:
- Document metadata (title, author, version, language)
- Content as Slate.js JSON
- Paragraph and character styles
- Master page configurations
- Variables and conditions

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Roadmap

Future enhancements planned:
- Real-time collaboration
- Cloud storage integration
- Advanced table editing
- Spell checking
- Track changes
- Comments and annotations
- Template gallery
- More export formats (EPUB, DocBook)
- Plugin system
- Accessibility improvements
