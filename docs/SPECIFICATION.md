# FrameMaker Web Clone - Technical Specification

## 1. Document Model Specification

### 1.1 Measurement System

**Base Unit**: Point (pt)
- 1 point = 1/72 inch
- 1 inch = 72 points
- 1 cm = 28.3465 points
- 1 pica = 12 points

**All measurements stored as numbers in points**. Display conversion handled by UI.

### 1.2 Document Structure

```typescript
interface FMDocument {
  id: string;
  version: "1.0";

  metadata: {
    title: string;
    author: string;
    createdAt: number;  // timestamp
    modifiedAt: number;
    keywords: string[];
  };

  settings: {
    units: "in" | "cm" | "pt" | "pica";
    snapToGrid: boolean;
    gridSpacing: number;  // in points
    showRulers: boolean;
    showGuides: boolean;
    showTextSymbols: boolean;
  };

  pageSize: {
    width: number;   // points
    height: number;  // points
  };

  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  columnSetup: {
    count: number;
    gap: number;  // points
  };

  pages: FMPage[];
  masterPages: FMMasterPage[];
  flows: FMFlow[];

  catalog: {
    paragraphFormats: FMParagraphFormat[];
    characterFormats: FMCharacterFormat[];
    tableFormats: FMTableFormat[];
  };

  variables: Record<string, string>;
  conditions: FMCondition[];
}
```

### 1.3 Page Structure

```typescript
interface FMPage {
  id: string;
  number: number;
  masterPageId: string | null;
  customSize?: { width: number; height: number };
  customMargins?: Margins;
  frames: FMFrame[];
}

interface FMMasterPage {
  id: string;
  name: string;
  pageType: "left" | "right" | "single";
  templateFrames: FMTextFrame[];  // copied to body pages
  backgroundFrames: FMFrame[];   // visible but not editable on body pages
}
```

### 1.4 Flow Structure

```typescript
interface FMFlow {
  id: string;
  tag: string;  // "A", "B", etc.
  autoconnect: boolean;
  frameIds: string[];  // ordered list of frame IDs in this flow
}
```

## 2. Frame Specification

### 2.1 Base Frame

```typescript
interface FMFrame {
  id: string;
  type: "text" | "anchored" | "unanchored";
  pageId: string;

  // Geometry (all in points)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;  // degrees, clockwise

  // Visual properties
  fill: {
    type: "none" | "solid" | "pattern";
    color?: string;  // hex color
    pattern?: number;  // pattern ID
  };

  stroke: {
    width: number;    // points
    color: string;    // hex color
    style: "solid" | "dashed" | "dotted";
  };

  // Layer
  zIndex: number;
  locked: boolean;
  visible: boolean;
}
```

### 2.2 Text Frame Specification

```typescript
interface FMTextFrame extends FMFrame {
  type: "text";

  flowTag: string;  // reference to flow

  // Column layout
  columns: number;
  columnGap: number;

  // Sidehead area (for margin notes)
  sideheadWidth: number;
  sideheadGap: number;
  sideheadPlacement: "left" | "right";

  // Text behavior
  balanceColumns: boolean;
  featherToBottom: boolean;

  // Content
  paragraphs: FMParagraph[];

  // Flow linking (managed by Flow object, but cached here)
  nextFrameId: string | null;
  prevFrameId: string | null;

  // Calculated (not stored)
  overflow: boolean;
}
```

**Text Frame Behavior**:
1. When user types, text is inserted at cursor position
2. Text automatically wraps at column width - sidehead width - margins
3. When text exceeds frame height and nextFrameId exists, excess flows to next frame
4. If no next frame and autoconnect is on, new page is added with template frames
5. If overflow occurs and cannot continue, `overflow` flag is set

### 2.3 Anchored Frame Specification

```typescript
interface FMAnchoredFrame extends FMFrame {
  type: "anchored";

  // Anchor point
  anchorParagraphId: string;
  anchorCharOffset: number;  // position in paragraph text

  // Positioning
  anchorPosition:
    | "inline"           // At Insertion Point - treated as character
    | "below"            // Below Current Line
    | "topOfColumn"      // At Top of Column
    | "bottomOfColumn"   // At Bottom of Column
    | "runInto"          // Run into Paragraph (text wraps around)
    | "outsideColumn"    // Outside Column (in margin)
    | "outsideTextFrame" // Outside Text Frame
  ;

  // Alignment (for non-inline positions)
  alignment: "left" | "center" | "right" | "inside" | "outside";

  // Size specification
  widthType: "fixed" | "column" | "margins" | "page" | "textframe";
  heightType: "fixed" | "auto";  // auto = shrink-wrap contents

  // Behavior
  cropped: boolean;    // clip contents to frame boundary
  floating: boolean;   // can move to next column if doesn't fit

  // Runaround (for runInto position)
  runaround: {
    type: "none" | "rectangle" | "contour";
    gap: number;  // points
  };

  // Contents
  contents: (FMGraphic | FMEquation | FMTextFrame | FMTable)[];
}
```

**Anchored Frame Positioning Algorithm**:

```
1. Find anchor paragraph in text flow
2. Find anchor character position within paragraph
3. Based on anchorPosition:

   INLINE:
   - Treat frame as character with width = frame.width, height = frame.height
   - Baseline alignment with surrounding text
   - Frame becomes part of text flow (affects line breaking)

   BELOW:
   - Position frame immediately below line containing anchor
   - Apply alignment (left, center, right relative to column)
   - Text continues after frame

   TOP_OF_COLUMN:
   - Position at top of current column (below any existing content)
   - If doesn't fit in current column, move to next column

   BOTTOM_OF_COLUMN:
   - Position at bottom of current column
   - Text fills space above frame

   RUN_INTO:
   - Position at left or right of column
   - Text wraps around frame using runaround gap
   - Frame top aligns with first line of paragraph

   OUTSIDE_COLUMN:
   - Position in margin area beside column
   - Does not affect text flow

   OUTSIDE_TEXT_FRAME:
   - Position outside entire text frame area
   - Does not affect text flow
```

### 2.4 Unanchored Frame Specification

```typescript
interface FMUnanchoredFrame extends FMFrame {
  type: "unanchored";

  // Runaround (how text interacts with this frame)
  runaround: {
    type: "none" | "rectangle" | "contour";
    gap: number;
  };

  // Content
  content: FMGraphic;
}
```

## 3. Text Content Specification

### 3.1 Paragraph Model

```typescript
interface FMParagraph {
  id: string;
  formatTag: string;  // reference to paragraph format in catalog

  // Inline content
  content: FMInlineElement[];

  // Format overrides (only properties that differ from format tag)
  overrides?: Partial<FMParagraphProperties>;
}

type FMInlineElement =
  | FMTextRun
  | FMAnchorMarker
  | FMVariable
  | FMCrossReference
  | FMMarker
  | FMFootnote
;

interface FMTextRun {
  type: "text";
  text: string;
  characterTag?: string;  // reference to character format
  overrides?: Partial<FMCharacterProperties>;
}

interface FMAnchorMarker {
  type: "anchor";
  frameId: string;  // reference to anchored frame
}

interface FMVariable {
  type: "variable";
  name: string;  // key in document.variables
}

interface FMCrossReference {
  type: "crossref";
  targetId: string;  // paragraph or marker ID
  format: string;    // display format
}

interface FMMarker {
  type: "marker";
  markerType: string;  // "Index", "Hypertext", etc.
  text: string;
}
```

### 3.2 Paragraph Format Properties

```typescript
interface FMParagraphProperties {
  // Basic
  firstIndent: number;   // points
  leftIndent: number;    // points
  rightIndent: number;   // points
  spaceAbove: number;    // points
  spaceBelow: number;    // points

  lineSpacing: {
    type: "fixed" | "proportional";
    value: number;  // points if fixed, multiplier if proportional
  };

  alignment: "left" | "center" | "right" | "justified";

  tabStops: FMTabStop[];

  // Default font
  defaultFont: FMCharacterProperties;

  // Pagination
  keepWithNext: boolean;
  keepWithPrevious: boolean;
  keepTogether: boolean;
  widowLines: number;   // minimum lines at bottom of column
  orphanLines: number;  // minimum lines at top of column

  startPosition: "anywhere" | "topOfColumn" | "topOfPage" | "topOfLeftPage" | "topOfRightPage";

  placement: "normal" | "sidehead" | "runin";

  runInDefaultPunct: string;  // e.g., ". " for run-in headings

  acrossColumns: "no" | "all" | "allAndSideheads";

  // Autonumbering
  autoNumber: {
    enabled: boolean;
    format: string;  // e.g., "<n+>.\\t" for "1.\t2.\t3.\t"
    characterTag: string;
    position: "start" | "end";
  };

  // Advanced
  hyphenation: {
    enabled: boolean;
    maxConsecutive: number;
    minPrefix: number;
    minSuffix: number;
    minWord: number;
  };

  wordSpacing: {
    min: number;    // percentage (100 = normal)
    optimal: number;
    max: number;
  };

  letterSpacing: {
    min: number;    // percentage
    optimal: number;
    max: number;
  };

  language: string;  // for hyphenation and spell checking
}

interface FMTabStop {
  position: number;  // points from left margin
  alignment: "left" | "center" | "right" | "decimal";
  leader: string;    // e.g., "." for dot leader
  decimalChar: string;  // for decimal tabs
}
```

### 3.3 Character Format Properties

```typescript
interface FMCharacterProperties {
  family: string;
  size: number;       // points
  weight: "normal" | "bold";
  style: "normal" | "italic" | "oblique";

  color: string;      // hex color
  backgroundColor?: string;

  underline: boolean;
  underlineStyle?: "single" | "double";
  strikethrough: boolean;
  overline: boolean;

  superscript: boolean;
  subscript: boolean;

  smallCaps: boolean;
  allCaps: boolean;

  tracking: number;   // letter spacing adjustment in points

  changeBar: boolean;

  // For "As Is" support in character formats
  asIs?: {
    [K in keyof FMCharacterProperties]?: true;
  };
}
```

## 4. Text Reflow Engine Specification

### 4.1 Core Algorithm

```typescript
interface ReflowEngine {
  /**
   * Reflow all text in a flow starting from given paragraph
   * @param flowTag - The flow to reflow
   * @param startParagraphId - Optional starting point (null = start from beginning)
   * @returns void, but updates frame.overflow flags and positions anchored frames
   */
  reflowFlow(flowTag: string, startParagraphId?: string): void;

  /**
   * Calculate line breaks for a single paragraph
   * @param paragraph - The paragraph to break
   * @param availableWidth - Width in points
   * @param format - Resolved paragraph format
   * @returns Array of lines with text and metrics
   */
  breakParagraph(
    paragraph: FMParagraph,
    availableWidth: number,
    format: FMParagraphProperties
  ): Line[];
}

interface Line {
  runs: Array<{
    text: string;
    width: number;
    format: FMCharacterProperties;
  }>;

  width: number;
  height: number;
  baseline: number;  // distance from top to baseline

  // For justified text
  spaces: number;
  stretchableWidth: number;
}
```

### 4.2 Line Breaking Algorithm (Knuth-Plass Inspired)

```
1. Convert paragraph to sequence of "boxes" (characters) and "glue" (spaces)
2. For each possible break point:
   a. Calculate line width if broken here
   b. Calculate badness (deviation from optimal width)
   c. Apply penalty for:
      - Hyphenation
      - Consecutive hyphens
      - Widow/orphan creation
3. Find optimal set of breaks minimizing total demerits
4. Adjust word/letter spacing for justified text
```

### 4.3 Text Measurement API

```typescript
interface TextMeasurer {
  /**
   * Measure width of text string with given format
   */
  measureText(text: string, format: FMCharacterProperties): number;

  /**
   * Get font metrics
   */
  getFontMetrics(format: FMCharacterProperties): {
    ascent: number;
    descent: number;
    lineHeight: number;
    xHeight: number;
  };

  /**
   * Find character position from x coordinate
   */
  hitTest(text: string, format: FMCharacterProperties, x: number): number;
}
```

**Implementation**: Use HTML Canvas `measureText()` API with proper font setup.

## 5. Rendering Specification

### 5.1 Page Rendering

Each page is rendered as a positioned HTML element:

```html
<div class="fm-page" style="
  width: 612pt;
  height: 792pt;
  position: relative;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
">
  <!-- Margin guides (when visible) -->
  <div class="fm-guides">...</div>

  <!-- Frames -->
  <div class="fm-frame fm-text-frame" style="
    position: absolute;
    left: 72pt;
    top: 72pt;
    width: 468pt;
    height: 648pt;
  ">
    <!-- Paragraphs -->
    <div class="fm-paragraph" style="...">
      <span class="fm-text-run">...</span>
    </div>
  </div>

  <!-- More frames... -->
</div>
```

### 5.2 Text Frame Rendering

```typescript
function renderTextFrame(frame: FMTextFrame): HTMLElement {
  const frameEl = document.createElement("div");
  frameEl.className = "fm-text-frame";
  frameEl.style.cssText = `
    position: absolute;
    left: ${frame.x}pt;
    top: ${frame.y}pt;
    width: ${frame.width}pt;
    height: ${frame.height}pt;
    transform: rotate(${frame.rotation}deg);
    overflow: hidden;
    cursor: text;
  `;

  // Render columns
  const columnWidth = (frame.width - frame.columnGap * (frame.columns - 1)) / frame.columns;

  for (let col = 0; col < frame.columns; col++) {
    const columnEl = document.createElement("div");
    columnEl.className = "fm-column";
    columnEl.style.cssText = `
      position: absolute;
      left: ${col * (columnWidth + frame.columnGap)}pt;
      top: 0;
      width: ${columnWidth}pt;
      height: ${frame.height}pt;
    `;

    // Paragraphs are distributed across columns by reflow engine
    // Each paragraph div contains styled text spans

    frameEl.appendChild(columnEl);
  }

  return frameEl;
}
```

### 5.3 Interactive Text Editing

Text frames use `contenteditable` with custom input handling:

```typescript
interface TextEditingState {
  activeFrameId: string | null;
  cursor: {
    paragraphId: string;
    offset: number;  // character offset in paragraph
  };
  selection: {
    start: { paragraphId: string; offset: number };
    end: { paragraphId: string; offset: number };
  } | null;
}

class TextEditorController {
  private state: TextEditingState;

  // Handle keyboard input
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.insertParagraph();
    } else if (event.key === "Backspace") {
      this.deleteBackward();
    } else if (event.key === "Delete") {
      this.deleteForward();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      this.insertText(event.key);
    }
  }

  insertText(text: string): void {
    // 1. Get current paragraph
    // 2. Insert text at cursor offset
    // 3. Trigger reflow from this paragraph
    // 4. Update cursor position
    // 5. Re-render affected frames
  }

  applyCharacterFormat(formatTag: string): void {
    // 1. Get selection range
    // 2. Split text runs at selection boundaries
    // 3. Apply character tag to selected runs
    // 4. Trigger reflow (in case size changes)
    // 5. Re-render
  }
}
```

## 6. Frame Manipulation Specification

### 6.1 Selection System

```typescript
interface SelectionManager {
  selectedFrameIds: string[];

  selectFrame(frameId: string, addToSelection?: boolean): void;
  deselectAll(): void;

  // Returns selection bounds for multiple frame selection
  getSelectionBounds(): Rectangle;
}
```

### 6.2 Drag and Resize Operations

```typescript
interface DragOperation {
  type: "move" | "resize";
  frameIds: string[];
  startPoint: Point;
  currentPoint: Point;
  resizeHandle?: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

  // For snapping
  snapX: number | null;
  snapY: number | null;
}

class DragController {
  private operation: DragOperation | null = null;

  startMove(frameIds: string[], startPoint: Point): void {
    this.operation = {
      type: "move",
      frameIds,
      startPoint,
      currentPoint: startPoint,
      snapX: null,
      snapY: null,
    };
  }

  updateDrag(currentPoint: Point): void {
    if (!this.operation) return;

    const dx = currentPoint.x - this.operation.startPoint.x;
    const dy = currentPoint.y - this.operation.startPoint.y;

    // Calculate snap positions
    // Update frame positions (visual feedback only)
    // Show dimension overlay
  }

  endDrag(): void {
    if (!this.operation) return;

    // Commit changes to document store
    // Trigger reflow if needed (for anchored frames)
    // Update undo stack

    this.operation = null;
  }
}
```

### 6.3 Resize Handles

8 handles positioned around selected frame:

```
[nw]----[n]----[ne]
  |             |
 [w]          [e]
  |             |
[sw]----[s]----[se]
```

Handle size: 8pt × 8pt (visible) with 12pt hit area.

## 7. Event System Specification

### 7.1 Document Events

```typescript
type DocumentEvent =
  | { type: "paragraph-changed"; paragraphId: string }
  | { type: "frame-added"; frameId: string }
  | { type: "frame-removed"; frameId: string }
  | { type: "frame-moved"; frameId: string }
  | { type: "frame-resized"; frameId: string }
  | { type: "page-added"; pageId: string }
  | { type: "page-removed"; pageId: string }
  | { type: "style-changed"; styleTag: string }
;

class EventBus {
  private listeners: Map<string, Function[]> = new Map();

  on(eventType: string, callback: Function): void;
  off(eventType: string, callback: Function): void;
  emit(event: DocumentEvent): void;
}
```

### 7.2 Undo/Redo System

```typescript
interface UndoStack {
  past: DocumentSnapshot[];
  future: DocumentSnapshot[];

  pushState(snapshot: DocumentSnapshot): void;
  undo(): DocumentSnapshot | null;
  redo(): DocumentSnapshot | null;
  canUndo(): boolean;
  canRedo(): boolean;
}
```

Use immutable data structures or snapshot entire document state (for simplicity in initial implementation).

## 8. Performance Specifications

### 8.1 Targets

- **Keystroke response**: < 16ms
- **Frame drag**: < 16ms per frame
- **Reflow (single page)**: < 100ms
- **Reflow (10 page document)**: < 1000ms
- **Initial load**: < 3 seconds
- **Memory usage**: < 200MB for 100-page document

### 8.2 Optimization Strategies

1. **Incremental Reflow**: Only reflow from changed paragraph forward
2. **Dirty Tracking**: Mark frames/pages as needing re-render
3. **Virtual Scrolling**: Only render visible pages in long documents
4. **Text Measurement Caching**: Cache line break results until paragraph changes
5. **Web Workers**: Offload reflow calculations to worker thread (future optimization)

## 9. File Format Specification

### 9.1 Native Format (JSON)

```json
{
  "version": "1.0",
  "metadata": {
    "title": "Document Title",
    "author": "Author Name",
    "createdAt": 1700000000000,
    "modifiedAt": 1700000001000
  },
  "settings": {
    "units": "in",
    "snapToGrid": true,
    "gridSpacing": 18
  },
  "pageSize": {
    "width": 612,
    "height": 792
  },
  "margins": {
    "top": 72,
    "bottom": 72,
    "left": 72,
    "right": 72
  },
  "pages": [...],
  "masterPages": [...],
  "flows": [...],
  "catalog": {
    "paragraphFormats": [...],
    "characterFormats": [...],
    "tableFormats": [...]
  }
}
```

### 9.2 Export Formats

- **PDF**: Print-quality output with correct positioning
- **HTML**: Web-friendly export with CSS styling
- **Plain Text**: Content only, no formatting

## 10. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Document model data structures
- Basic page rendering (single page, white rectangle)
- Single text frame with hardcoded content
- Basic CSS styling

### Phase 2: Text Editing (Week 3-4)
- Cursor implementation
- Text insertion/deletion
- Basic character formatting (bold, italic)
- Single paragraph reflow

### Phase 3: Paragraph System (Week 5-6)
- Multiple paragraphs
- Paragraph format catalog
- Paragraph Designer panel
- Inter-paragraph spacing

### Phase 4: Multi-Frame Flow (Week 7-8)
- Multiple text frames on page
- Flow connection
- Cross-frame text reflow
- Overflow indicators

### Phase 5: Frame Manipulation (Week 9-10)
- Frame selection
- Drag to move
- Resize handles
- Frame creation tools

### Phase 6: Multiple Pages (Week 11-12)
- Page navigation
- Page thumbnails
- Master pages (basic)
- Auto-add pages on overflow

### Phase 7: Anchored Frames (Week 13-14)
- Anchored frame creation dialog
- Position types implementation
- Frame movement with text
- Runaround

### Phase 8: Advanced Features (Week 15+)
- Tables
- Equations
- Variables and cross-references
- Import/Export

---

This specification provides the technical foundation for implementing a professional-grade frame-based page layout system. Each component is designed to mirror FrameMaker's actual behavior while using modern web technologies.
