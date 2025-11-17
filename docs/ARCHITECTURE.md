# FrameMaker Web Clone - Architecture Document

## Overview

This document defines the technical architecture for a web-based clone of Adobe FrameMaker, implementing the core frame-based page layout paradigm with modern web technologies.

## Design Principles

1. **Frame-Centric**: Everything exists within or as a frame
2. **Direct Manipulation**: Click-to-edit, drag-to-move, handles-to-resize
3. **Real-Time Reflow**: Text automatically redistributes as content changes
4. **WYSIWYG Accuracy**: Screen matches print output at 72 DPI base
5. **Style-Based**: Formatting through reusable style catalogs
6. **Minimal Dependencies**: Core functionality without heavy frameworks

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Menu    │  │ Toolbars │  │    Property Panels   │  │
│  │  System  │  │          │  │                      │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Document View Layer                   │
│  ┌──────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Rulers  │  │   Page Canvas    │  │   Scrolling  │  │
│  │          │  │                  │  │   Container  │  │
│  └──────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                     Frame Layer                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Frame Container (Page)               │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │   │
│  │  │  Text   │  │Anchored │  │   Unanchored    │  │   │
│  │  │  Frame  │  │  Frame  │  │     Frame       │  │   │
│  │  │         │  │         │  │                 │  │   │
│  │  │ [Para]  │  │ [Eqn]   │  │    [Graphic]    │  │   │
│  │  │ [Para]  │  │ [Table] │  │                 │  │   │
│  │  │ [Para]  │  │ [Text]  │  │                 │  │   │
│  │  └─────────┘  └─────────┘  └─────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                   Content Model Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │Paragraph │  │Character │  │  Table   │  │Equation│  │
│  │   Model  │  │   Model  │  │  Model   │  │  Model │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                      Core Engine                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │   Text   │  │  Layout  │  │   Style  │  │Document│  │
│  │  Reflow  │  │  Engine  │  │  Catalog │  │  Store │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Document Store (`/src/document/`)

**Purpose**: Central source of truth for all document data.

```typescript
interface Document {
  metadata: DocumentMetadata;
  pages: Page[];
  masterPages: MasterPage[];
  styles: StyleCatalog;
  flows: FlowRegistry;
  variables: VariableSet;
  conditions: ConditionSet;
}
```

**Responsibilities**:
- Document loading/saving
- Undo/redo stack
- Change notification
- Serialization (to/from JSON/MIF-like format)

### 2. Page Model (`/src/page/`)

**Purpose**: Represents document pages and their frame containers.

```typescript
interface Page {
  id: string;
  number: number;
  masterPageId: string;
  size: PageSize;  // width, height in points
  margins: Margins;
  frames: Frame[];
}

interface MasterPage {
  id: string;
  name: string;
  left: boolean;  // left page for double-sided
  templateFrames: TextFrame[];
  backgroundFrames: Frame[];
}
```

### 3. Frame System (`/src/frames/`)

**Base Frame Interface**:
```typescript
interface Frame {
  id: string;
  type: FrameType;
  bounds: Rectangle;  // x, y, width, height in points
  rotation: number;
  zIndex: number;
  locked: boolean;

  // Visual properties
  fill: FillStyle;
  stroke: StrokeStyle;
  runaround: RunaroundStyle;
}
```

**Text Frame** (Primary content container):
```typescript
interface TextFrame extends Frame {
  type: 'text';
  flowTag: string;
  columnCount: number;
  columnGap: number;
  sideheadWidth: number;
  sideheadGap: number;
  balanceColumns: boolean;
  featherText: boolean;

  // Content
  paragraphs: Paragraph[];

  // Flow connection
  nextFrame?: string;  // ID of next frame in flow
  prevFrame?: string;  // ID of previous frame in flow
}
```

**Anchored Frame** (Moves with text):
```typescript
interface AnchoredFrame extends Frame {
  type: 'anchored';
  anchorPosition: AnchorPosition;
  anchorParagraphId: string;
  anchorOffset: number;  // character offset in paragraph

  // Positioning
  position: 'inline' | 'below' | 'top' | 'bottom' | 'runinto' | 'outside';
  alignment: 'left' | 'center' | 'right' | 'inside' | 'outside';
  floatIfNeeded: boolean;

  // Size
  width: WidthSpec;  // fixed, column, margins, page
  height: number;
  cropped: boolean;

  // Content
  contents: (Graphic | Equation | TextFrame | Table)[];
}
```

**Unanchored Frame** (Fixed on page):
```typescript
interface UnanchoredFrame extends Frame {
  type: 'unanchored';
  contents: Graphic;
}
```

### 4. Text Model (`/src/text/`)

**Paragraph Structure**:
```typescript
interface Paragraph {
  id: string;
  formatTag: string;  // Reference to ParagraphFormat
  overrides: Partial<ParagraphProperties>;

  // Content
  runs: TextRun[];

  // Anchored frames attached to this paragraph
  anchors: AnchorPoint[];
}

interface TextRun {
  id: string;
  text: string;
  characterTag?: string;  // Reference to CharacterFormat
  overrides?: Partial<CharacterProperties>;
}

interface AnchorPoint {
  offset: number;  // Character position
  frameId: string;  // ID of anchored frame
}
```

### 5. Style Catalog (`/src/styles/`)

**Paragraph Format**:
```typescript
interface ParagraphFormat {
  tag: string;  // Unique name

  // Basic
  firstIndent: number;
  leftIndent: number;
  rightIndent: number;
  spaceAbove: number;
  spaceBelow: number;
  lineSpacing: LineSpacing;
  alignment: Alignment;
  tabStops: TabStop[];

  // Default Font
  defaultFont: CharacterProperties;

  // Pagination
  startPosition: StartPosition;
  keepWithNext: boolean;
  keepWithPrevious: boolean;
  widowOrphanLines: number;
  placement: 'body' | 'sidehead' | 'runin';
  acrossColumns: boolean;

  // Numbering
  autoNumber: AutoNumbering;

  // Advanced
  hyphenation: HyphenationSettings;
  wordSpacing: SpacingRange;
  language: string;
}
```

**Character Format**:
```typescript
interface CharacterFormat {
  tag: string;

  // Each property can be 'asis' (inherit) or specific value
  family?: string | 'asis';
  size?: number | 'asis';
  weight?: FontWeight | 'asis';
  angle?: FontAngle | 'asis';
  color?: Color | 'asis';
  underline?: boolean | 'asis';
  strikethrough?: boolean | 'asis';
  superscript?: boolean | 'asis';
  subscript?: boolean | 'asis';
  changeBar?: boolean | 'asis';
  // ... etc
}
```

### 6. Text Reflow Engine (`/src/reflow/`)

**Purpose**: Automatically layouts text across connected frames.

**Core Algorithm**:
```
1. Start with first frame in flow
2. Measure available space (columns, sideheads, margins)
3. For each paragraph:
   a. Apply paragraph format
   b. Break text into lines (respecting hyphenation, word spacing)
   c. Position lines in columns
   d. Handle anchored frames (calculate position, apply runaround)
   e. Check for page/column breaks
   f. If overflow, continue to next connected frame
4. If all frames full and Autoconnect enabled:
   a. Add new page from master page template
   b. Continue reflow
5. Mark any remaining overflow
```

**Key Classes**:
```typescript
class ReflowEngine {
  reflowAll(document: Document): void;
  reflowFrom(paragraphId: string): void;
  calculateLineBreaks(para: Paragraph, width: number): Line[];
  positionAnchoredFrame(frame: AnchoredFrame, context: FlowContext): void;
}

class LineBreaker {
  breakParagraph(para: Paragraph, availableWidth: number): Line[];
}

class TextMeasurer {
  measureText(text: string, format: CharacterProperties): number;
  measureParagraph(para: Paragraph): ParagraphMetrics;
}
```

### 7. Layout Engine (`/src/layout/`)

**Purpose**: Positions all frames on pages.

```typescript
class LayoutEngine {
  layoutPage(page: Page): void;
  positionFrame(frame: Frame): void;
  calculateRunaround(frames: Frame[]): RunaroundRegion[];
  balanceColumns(textFrame: TextFrame): void;
}
```

### 8. Rendering Engine (`/src/render/`)

**Purpose**: Draws document to screen.

**Strategy**: Use HTML/CSS for text rendering (leveraging browser's text layout), Canvas for graphics and precise positioning.

```typescript
class PageRenderer {
  renderPage(page: Page, container: HTMLElement): void;
  renderFrame(frame: Frame, parent: HTMLElement): HTMLElement;
  renderTextFrame(frame: TextFrame): HTMLElement;
  renderAnchoredFrame(frame: AnchoredFrame): HTMLElement;
  renderGraphic(graphic: Graphic): HTMLElement | SVGElement;
}
```

### 9. Interaction Manager (`/src/interaction/`)

**Purpose**: Handles user input for frame manipulation.

```typescript
class InteractionManager {
  // Frame selection
  selectFrame(frame: Frame): void;
  deselectAll(): void;

  // Direct manipulation
  startDrag(frame: Frame, point: Point): void;
  updateDrag(point: Point): void;
  endDrag(): void;

  startResize(frame: Frame, handle: ResizeHandle): void;
  updateResize(point: Point): void;
  endResize(): void;

  // Text editing
  startTextEdit(frame: TextFrame, position: TextPosition): void;
  insertText(text: string): void;
  deleteText(range: TextRange): void;
  applyCharacterFormat(format: CharacterFormat): void;
}
```

### 10. Text Editor (`/src/editor/`)

**Purpose**: Rich text editing within text frames.

```typescript
class TextEditor {
  // Cursor management
  cursor: TextCursor;
  selection: TextSelection;

  // Editing operations
  insertCharacter(char: string): void;
  insertParagraph(): void;
  deleteSelection(): void;

  // Formatting
  applyParagraphFormat(tag: string): void;
  applyCharacterFormat(tag: string): void;
  applyOverrides(props: Partial<CharacterProperties>): void;

  // Navigation
  moveCursor(direction: Direction, unit: TextUnit): void;
  selectWord(): void;
  selectParagraph(): void;
}
```

## Technology Stack

### Core Technologies
- **TypeScript**: Strong typing for complex document model
- **React 18**: UI components (menus, panels, dialogs)
- **ContentEditable + Custom Logic**: Rich text editing
- **CSS Grid/Flexbox**: Panel layout
- **Canvas API**: Graphics rendering, precise measurements

### No External Dependencies For:
- Text reflow (custom implementation)
- Line breaking (custom implementation)
- Text measurement (Canvas API measureText)
- Document model (plain TypeScript)

### Minimal Dependencies:
- **React**: UI framework (necessary for complex UI)
- **Vite**: Build tool
- Possibly:
  - **KaTeX**: Math equation rendering
  - **PDF-lib**: PDF export (if needed)

## File Structure

```
/src
  /document        # Document model and store
    Document.ts
    Page.ts
    MasterPage.ts
    Store.ts

  /frames          # Frame types
    Frame.ts
    TextFrame.ts
    AnchoredFrame.ts
    UnanchoredFrame.ts

  /text            # Text model
    Paragraph.ts
    TextRun.ts
    TextCursor.ts
    TextSelection.ts

  /styles          # Style catalog
    ParagraphFormat.ts
    CharacterFormat.ts
    TableFormat.ts
    Catalog.ts

  /reflow          # Text reflow engine
    ReflowEngine.ts
    LineBreaker.ts
    TextMeasurer.ts
    ColumnLayout.ts

  /layout          # Page layout
    LayoutEngine.ts
    Runaround.ts
    PageBreak.ts

  /render          # Screen rendering
    PageRenderer.ts
    FrameRenderer.ts
    SelectionOverlay.ts

  /interaction     # User interaction
    InteractionManager.ts
    DragHandler.ts
    ResizeHandler.ts

  /editor          # Text editing
    TextEditor.ts
    InputHandler.ts
    ClipboardHandler.ts

  /ui              # React UI components
    /panels
      ParagraphDesigner.tsx
      CharacterDesigner.tsx
      TableDesigner.tsx
    /toolbars
      MainToolbar.tsx
      FormatToolbar.tsx
    /dialogs
      AnchoredFrameDialog.tsx
      TableDialog.tsx
    App.tsx

  /export          # Export functionality
    PDFExporter.ts
    HTMLExporter.ts
    JSONSerializer.ts

  main.tsx
```

## Performance Considerations

1. **Incremental Reflow**: Only recalculate from changed paragraph forward
2. **Virtual Rendering**: Only render visible pages
3. **Text Caching**: Cache line break calculations until content changes
4. **Frame Pooling**: Reuse DOM elements for frames
5. **Debounced Updates**: Batch multiple changes before reflow

## Data Flow

```
User Action → Interaction Manager → Document Store (mutation)
                                          ↓
                              Change Notification
                                          ↓
                              Reflow Engine (if text changed)
                                          ↓
                              Layout Engine (if frames changed)
                                          ↓
                              Renderer (update view)
```

## Key Technical Challenges

1. **Accurate Text Measurement**: Browser font metrics vs. print metrics
2. **Bidirectional Reflow**: Changes in one frame affect others
3. **Anchored Frame Positioning**: Complex rules based on position type
4. **Runaround Calculation**: Text wrapping around irregular shapes
5. **Performance**: Large documents with many pages and frames
6. **Undo/Redo**: Complex state management with interconnected objects

## Next Steps

1. Create detailed DESIGN.md with UI/UX specifications
2. Write SPECIFICATION.md with exact APIs and behaviors
3. Implement core modules in priority order:
   - Document model
   - Basic text frame rendering
   - Text editing
   - Text reflow
   - Frame manipulation
   - Style system
   - Anchored frames
   - Tables and equations
