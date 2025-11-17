# FrameMaker Web Clone - Design Plan

## Visual Design Philosophy

Replicate the professional, dense, information-rich interface of FrameMaker circa 1995, but with modern rendering. The interface should feel like a serious desktop publishing tool, not a web app.

## Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [File] [Edit] [Format] [View] [Special] [Graphics] [Table]     │  Menu Bar
├─────────────────────────────────────────────────────────────────┤
│ [New][Open][Save]│[Undo][Redo]│[Cut][Copy][Paste]│[Zoom ▼]     │  Main Toolbar
├─────────────────────────────────────────────────────────────────┤
│ [¶ Body     ▼][Times New Roman ▼][12pt ▼][B][I][U]│[≡][≡][≡]  │  Formatting Bar
├──────┬──────────────────────────────────────────────────┬───────┤
│  in  │    Ruler (inches/points with tab stops)          │       │
├──────┼──────────────────────────────────────────────────┤       │
│      │                                                  │       │
│  1   │         ┌─────────────────────┐                  │ Para  │
│      │         │     PAGE VIEW       │                  │ graph │
│  2   │         │                     │                  │       │
│      │         │  [Text Frame]       │                  │ Desig │
│  3   │         │  ┌─────────────┐    │                  │ ner   │
│      │         │  │ Paragraph   │    │                  │       │
│  4   │         │  │ with inline │    │                  │ Panel │
│      │         │  │ cursor |    │    │                  │       │
│  5   │         │  │             │    │                  │       │
│      │         │  └─────────────┘    │                  │       │
│  6   │         │                     │                  │       │
│      │         └─────────────────────┘                  │       │
│  7   │                                                  │       │
│      │                                                  │       │
├──────┴──────────────────────────────────────────────────┴───────┤
│ Page 1 of 12 │ Flow: A │ Body ¶ │ 100% │ Modified              │  Status Bar
└─────────────────────────────────────────────────────────────────┘
```

## Core UI Components

### 1. Menu Bar
Standard menu structure matching FrameMaker:
- **File**: New, Open, Save, Save As, Revert, Import, Print, Preferences
- **Edit**: Undo, Redo, Cut, Copy, Paste, Clear, Select All
- **Format**: Paragraphs, Characters, Page Layout, Document, Customize Layout
- **View**: Body Pages, Master Pages, Reference Pages, Zoom, Options
- **Special**: Marker, Variables, Cross-Reference, Conditional Text, Anchored Frame, Footnote
- **Graphics**: Tools, Object Properties, Runaround, Align, Distribute, Group
- **Table**: Insert Table, Table Designer, Add Rows/Columns, Straddle/Unstraddle

### 2. Main Toolbar (Icon-based)
Quick access to common operations:
- Document: New, Open, Save
- Edit: Undo, Redo
- Clipboard: Cut, Copy, Paste
- Zoom: Dropdown (25%, 50%, 75%, 100%, 150%, 200%, Fit Page, Fit Window)

### 3. Formatting Bar (Text-centric)
Live paragraph and character formatting:
- Paragraph tag dropdown (Body, Heading1, Heading2, etc.)
- Font family dropdown
- Font size dropdown
- Bold, Italic, Underline toggle buttons
- Alignment buttons (Left, Center, Right, Justify)

### 4. Rulers
- **Horizontal Ruler**: Shows page width with margin markers, tab stops
- **Vertical Ruler**: Shows page height with margin markers
- Unit display: inches, cm, points, picas (configurable)
- Interactive: Drag to set indents, click to add tab stops

### 5. Page View Area

**Canvas Behavior**:
- Gray pasteboard surrounding white page
- Page size: Letter (8.5" × 11" = 612pt × 792pt)
- Accurate point-based positioning
- Zoom affects entire view (including rulers)
- Scroll to navigate multi-page documents

**Page Rendering**:
- White page background with drop shadow
- Margin guides (cyan dashed lines)
- Column guides (if multi-column)
- Text frames visible as thin black borders (when View > Text Frame Borders)
- Baseline grid (optional)

### 6. Text Frame Editing

**Direct Editing**:
- Click in text frame → insertion cursor appears at click position
- No separate dialog for text entry
- Type directly into frame
- Text wraps automatically within frame columns
- Cursor blinks at insertion point

**Selection**:
- Click and drag to select text range
- Double-click selects word
- Triple-click selects paragraph
- Shift+click extends selection
- Ctrl+A selects all text in flow

**Cursor Appearance**:
- Thin vertical line (I-beam when hovering)
- Positioned precisely between characters
- Shows character height at that position

### 7. Frame Selection and Manipulation

**Selecting Frames**:
- Click on frame border (not content) to select frame
- Ctrl+click to add to selection
- Selection shows 8 resize handles (corners + midpoints)
- Selected frame has thick blue border

**Resizing**:
- Drag corner handles to resize proportionally (optional)
- Drag edge handles to resize single dimension
- Status bar shows dimensions during drag
- Snap to grid (configurable)

**Moving**:
- Drag selected frame (not on handle) to move
- Shows position coordinates during drag
- Snap to guides and grid

**Rotation Handle**:
- Circle above top-center handle
- Drag to rotate frame
- Shift constrains to 15° increments

### 8. Property Panels

**Paragraph Designer Panel** (Dockable):
```
┌─────────────────────────────┐
│ Paragraph Designer          │
├─────────────────────────────┤
│ Properties: [Basic      ▼]  │
├─────────────────────────────┤
│ Indents:                    │
│   First:  [12pt    ]        │
│   Left:   [0pt     ]        │
│   Right:  [0pt     ]        │
│                             │
│ Space:                      │
│   Above:  [12pt    ]        │
│   Below:  [6pt     ]        │
│                             │
│ Line Spacing:               │
│   [1.5] lines               │
│                             │
│ Alignment:                  │
│   (•) Left  ( ) Center      │
│   ( ) Right ( ) Justified   │
│                             │
│ Tab Stops:                  │
│   [Edit...]                 │
│                             │
├─────────────────────────────┤
│ Paragraph Tag: [Body     ▼] │
│                             │
│ [Apply] [Update All] [New]  │
└─────────────────────────────┘
```

Tabs for properties:
- **Basic**: Indents, spacing, alignment, tabs
- **Default Font**: Font family, size, style, color
- **Pagination**: Breaks, keeps, widows/orphans, side heads
- **Numbering**: Auto-number format, position
- **Advanced**: Hyphenation, word spacing, language

**Character Designer Panel**:
- Font family, size, style
- Color picker
- Effects: underline, strikethrough, overline
- Position: normal, superscript, subscript
- Change bar toggle

**Table Designer Panel**:
- Basic: Indents, cell margins, alignment
- Ruling: Border styles, row/column rules
- Shading: Background colors

### 9. Anchored Frame Dialog

When inserting anchored frame (Special > Anchored Frame...):

```
┌─────────────────────────────────────┐
│ Anchored Frame                      │
├─────────────────────────────────────┤
│ Anchoring Position:                 │
│   (•) At Insertion Point            │
│   ( ) Below Current Line            │
│   ( ) At Top of Column              │
│   ( ) At Bottom of Column           │
│   ( ) Run into Paragraph            │
│   ( ) Outside Column                │
│   ( ) Outside Text Frame            │
│                                     │
│ Alignment: [Left             ▼]     │
│                                     │
│ Size:                               │
│   Width:  [3.0 in   ]               │
│           [Column    ▼]             │
│   Height: [2.0 in   ]               │
│                                     │
│ [ ] Cropped                         │
│ [ ] Floating                        │
│                                     │
│ [Insert] [Cancel]                   │
└─────────────────────────────────────┘
```

### 10. Status Bar

Left to right:
- Current page number / Total pages
- Current flow tag (A, B, etc.)
- Current paragraph format
- Zoom percentage
- Document modified indicator

## Interaction Patterns

### 1. Text Editing Mode

**Entry**: Click inside text frame
**Exit**: Click outside all frames, press Escape, or click on frame border

**Keyboard Shortcuts**:
- **Ctrl+B**: Bold
- **Ctrl+I**: Italic
- **Ctrl+U**: Underline
- **Ctrl+M**: Open Paragraph Designer
- **Ctrl+D**: Open Character Designer
- **Ctrl+Shift+P**: Apply paragraph tag
- **Tab**: Insert tab character
- **Enter**: New paragraph
- **Shift+Enter**: Soft line break

### 2. Frame Manipulation Mode

**Entry**: Click on frame border (not content), or use Smart Select (Ctrl+click anywhere in frame)
**Exit**: Click away or press Escape

**Actions**:
- **Delete**: Remove selected frame
- **Ctrl+C**: Copy frame
- **Ctrl+V**: Paste frame
- **Arrow keys**: Nudge frame position
- **Ctrl+Arrow**: Larger nudge

### 3. Drawing Frames

**Tool Selection**: Choose tool from Graphics menu or toolbar
**Drawing**:
1. Click start point
2. Drag to opposite corner
3. Release to create frame
4. Frame immediately selected for property adjustment

**Frame Types Available**:
- Text Frame tool
- Graphic Frame tool (for images)
- Rectangle, Ellipse, Line, Polygon (graphics)

### 4. Text Flow Visualization

**Show Text Flow** (View > Show Text Flow):
- Displays arrow from end of one frame to start of next
- Click arrows to navigate through flow
- Unlinked frames show break indicator

**Overflow Indicator**:
- Red "+" symbol in bottom-right of overfull frame
- Indicates text exists but doesn't fit
- Click to extend flow or add connected frame

## Visual Feedback

### 1. Cursor Feedback
- **Arrow**: Default, frame selection
- **I-beam**: Text editing
- **Crosshair**: Drawing mode
- **Move**: Over selected frame (not on handles)
- **Resize cursors**: Over resize handles (nw-resize, ne-resize, etc.)
- **Grab/Grabbing**: Pan mode

### 2. Selection Feedback
- **Text selection**: Blue highlight over selected characters
- **Frame selection**: Blue border with white square handles
- **Multiple frame selection**: Blue border around each, handles on bounding box

### 3. Guides and Snapping
- **Margin guides**: Cyan dashed lines
- **Column guides**: Magenta dashed lines
- **Grid**: Subtle gray dots or lines
- **Snap feedback**: Frame edges glow when aligning to guides

### 4. Frame Type Indicators
- **Text frame**: Thin black border, text cursor when inside
- **Anchored frame**: Anchor symbol at attachment point
- **Graphic frame**: Image icon if empty
- **Table**: Grid icon if empty

## Color Scheme

**FrameMaker Classic** (circa 1995-2000):
- Menu bar: Light gray background (#D4D0C8)
- Toolbars: Slightly lighter gray (#E0E0E0)
- Pasteboard: Medium gray (#808080)
- Page: Pure white (#FFFFFF)
- Selection: Blue (#0000FF)
- Guides: Cyan (#00FFFF), Magenta (#FF00FF)
- Text: Black (#000000)
- Frame borders: Black (#000000)

## Typography in Interface

- **Menus and dialogs**: System font (Segoe UI, San Francisco, etc.) 10-11pt
- **Toolbar labels**: 10pt
- **Panel headers**: 11pt bold
- **Status bar**: 10pt

## Responsive Behavior

This is a **desktop application clone**, not responsive design:
- Fixed minimum width: 1024px
- Fixed minimum height: 768px
- Panels can be docked/undocked
- Toolbars can be shown/hidden
- No mobile/tablet adaptations

## Accessibility Considerations

- All menu items keyboard accessible
- Keyboard shortcuts for common operations
- High contrast mode support
- Screen reader support for text content (via proper semantic HTML)

## Performance Targets

- **Initial load**: < 2 seconds
- **Page switch**: < 100ms
- **Text typing**: < 16ms latency (60fps)
- **Frame drag**: < 16ms latency
- **Reflow**: < 500ms for typical document

## Implementation Priority

### Phase 1: Core Frame Editing
1. Page canvas with accurate dimensions
2. Basic text frame with inline editing
3. Paragraph formatting (basic properties)
4. Character formatting (bold, italic, etc.)
5. Text reflow within single frame

### Phase 2: Multi-Frame Flow
1. Multiple text frames on page
2. Text flow between connected frames
3. Frame selection and manipulation
4. Multiple pages with navigation
5. Overflow indicators

### Phase 3: Anchored Frames
1. Anchored frame creation
2. Position types (inline, below, etc.)
3. Frame moves with text
4. Runaround (text wrapping)

### Phase 4: Advanced Features
1. Master pages
2. Tables
3. Equations
4. Variables and cross-references
5. Conditional text

### Phase 5: Polish
1. Rulers with interactive elements
2. All panel designs
3. Import/Export
4. Undo/Redo
5. Preferences
