# FrameMaker Research Findings

## Historical Context

FrameMaker was created by Frame Technology Corporation in 1986. Adobe acquired it in 1995 (FrameMaker 5.0). By 1995, it was already a mature, fully-featured desktop publishing system known for:
- Long-document support (technical manuals, books)
- Frame-based page layout
- Sophisticated text flow and threading
- Powerful equation editor
- Structured authoring capabilities

## Core Architecture: The Frame Model

### Four Frame Types in FrameMaker

1. **Text Frames** (Template and Background)
   - Template text frames: Hold flowing document text on body pages
   - Background text frames: Hold headers/footers on master pages
   - Properties:
     - Column count (1-10 columns)
     - Column gap
     - Sideheads area (for margin notes)
     - Flow tag (A, B, C... for threading)
     - Autoconnect (automatic page addition when full)
     - Balance columns (equalize text in terminal columns)
     - Feathering (vertical justification)

2. **Anchored Frames** (AFrames)
   - Attached to specific text insertion point
   - Move with text during editing
   - Positioning options:
     - **At Insertion Point**: Inline with text baseline
     - **Below Current Line**: Separate line, left/center/right aligned
     - **At Top of Column**: Floats to column top
     - **At Bottom of Column**: Floats to column bottom
     - **Run into Paragraph**: Text wraps around (drop caps, sidebars)
     - **Outside Column**: In margin area
     - **Outside Text Frame**: Beyond text column boundaries
   - Properties:
     - Width (from column, page margins, etc.)
     - Alignment (left, center, right, inside, outside)
     - Cropping enabled/disabled
     - Floating (can move to next column if doesn't fit)
   - Can contain: graphics, equations, nested text frames, tables

3. **Unanchored Frames** (Graphic Frames)
   - Fixed position on page
   - Do not move with text
   - Used for page decorations, watermarks, fixed graphics
   - Runaround properties (text flows around them)

4. **Table Frames**
   - Special anchored structure
   - Contains: heading rows, body rows, footing rows
   - Cell properties: straddling (merging), rotation, shading
   - Can straddle (span) across columns

### Document Page Structure

1. **Master Pages** (up to 100)
   - Define page layout templates
   - Contain:
     - Template text frames (copied to body pages)
     - Background text frames (headers/footers)
     - Background graphics
   - Left/Right master page pairs for double-sided documents
   - Custom master pages for special layouts (title pages, etc.)

2. **Body Pages**
   - Actual content pages
   - Inherit layout from assigned master page
   - Template text frames become editable text areas
   - Background elements appear but are not editable

3. **Reference Pages**
   - Store reusable graphics
   - HTML conversion mappings
   - Catalog of frequently used elements

## Text Flow Architecture

### Flow System
- Each text frame belongs to a "flow" (tagged A, B, C, etc.)
- Flows can be:
  - **Single flow**: One continuous text stream (most documents)
  - **Parallel flows**: Multiple independent text streams (newsletters)
  - **Connected flows**: Threading between non-contiguous frames

### Text Frame Connection
- Format > Customize Layout > Connect Text Frames
- Text automatically reflows when:
  - Editing adds/removes content
  - Frames are resized
  - Pages are added/removed

### Autoconnect Behavior
- When enabled: FrameMaker automatically adds pages when text frames fill
- Template frames from master page are instantiated
- Preserves flow continuity

## Paragraph Formatting

### Paragraph Designer Properties

1. **Basic Properties**
   - First Line Indent (points)
   - Left Indent (points)
   - Right Indent (points)
   - Space Above (points)
   - Space Below (points)
   - Line Spacing (fixed or relative)
   - Alignment: Left, Center, Right, Justified
   - Tab Stops (custom positions, leaders, alignment)

2. **Default Font Properties**
   - Family (Times, Helvetica, etc.)
   - Size (points)
   - Weight (Regular, Bold, etc.)
   - Angle (Regular, Italic, Oblique)
   - Variation (Regular, Small Caps, etc.)
   - Color
   - Spread (tracking/letter-spacing)
   - Stretch (horizontal scaling)

3. **Pagination Properties**
   - Start: Anywhere, Top of Column, Top of Page, Top of Left Page, Top of Right Page
   - Keep With: Next Paragraph, Previous Paragraph
   - Widow/Orphan Lines control
   - Format: In Column, Run-In Head, Side Head
   - Side Head Area width/gap (for margin notes)
   - Across All Columns (spanning)
   - Across All Columns and Side Heads

4. **Numbering Properties**
   - Autonumber Format (Chapter, Section, Figure, etc.)
   - Character Format for numbers
   - Position (start of paragraph, end of paragraph)
   - Building blocks: <n+>, <n=1>, <$chapnum>, etc.

5. **Advanced Properties**
   - Hyphenation (on/off, parameters)
   - Word Spacing (min, max, optimum)
   - Frame Above/Below paragraph
   - Language (for spell checking)

## Character Formatting

### Character Designer Properties
- Family, Size, Weight, Angle, Variation
- Color
- Spread (letter spacing)
- Underline (with offset and thickness options)
- Strikethrough
- Overline
- Change Bar (revision marking)
- Superscript/Subscript position
- Case: As Typed, Uppercase, Lowercase, Small Caps
- Pair Kern (enable/disable)
- Tsume (Japanese text compression)

### Important: "As Is" Settings
- Character formats can leave properties "As Is"
- Only specified properties change when format applied
- Allows additive formatting (e.g., Bold character format only changes weight)

## Table Architecture

### Table Structure
- Title (optional, above or below)
- Heading Rows (repeat on each page)
- Body Rows
- Footing Rows (repeat on each page)
- Columns with individual widths

### Table Designer Properties
1. **Basic**: Indents, cell margins, vertical alignment, start position
2. **Ruling**: Border lines, row rules, column rules (thickness, style, color)
3. **Shading**: Background colors for rows/columns/cells

### Cell Operations
- **Straddle** (merge cells) - not stored in format, applied individually
- **Rotate** text (0°, 90°, 180°, 270°)
- **Custom ruling** per cell
- **Custom shading** per cell

### Table Positioning
- Orphan rows control
- Start position: Anywhere, Top of Column, Top of Page, Float
- Table can span columns (straddle)

## Equation Editor

### Equation Types
- **Inline equations**: Shrink-wrapped, treated as characters in text
- **Display equations**: In anchored frames, typically centered

### Shrink-Wrap Feature
- Equation frame shrinks to exact size of equation content
- Frame position: At Insertion Point
- Baseline alignment with surrounding text
- Can unwrap for editing, then re-shrink

### Equation Elements
- Mathematical operators
- Greek letters
- Matrices
- Integrals, summations
- Fractions, radicals
- Delimiters (parentheses, brackets)

## Runaround (Text Wrap)

### Properties
- **Run Around**: Text flows around object
- **Don't Run Around**: Text ignores object (overlaps)
- **Run Around Contour**: Follows shape outline (for irregular graphics)
- Gap settings (distance between text and object)

### Application
- Set per graphic object
- Graphics > Runaround Properties
- Affects text in same text frame or overlapping frames

## Cross-References and Variables

### Cross-References
- Point to paragraphs, pages, markers
- Auto-update on changes
- Formats: page number, paragraph text, heading text

### Variables
- **System Variables**: Page Count, Current Date, Filename, etc.
- **User Variables**: Custom defined, document-wide replacement
- Building Blocks for headers/footers

## Conditional Text

- Mark text with condition tags
- Show/hide based on conditions
- Multiple outputs from single source (e.g., different product versions)
- Visual indicators (colored underlines)

## Key Insights for Implementation

1. **Frames are NOT components** - they are interactive, editable containers
2. **Text frames contain actual paragraphs** with full formatting, not plain text
3. **Anchored frames are LIVE** - they update position during text editing
4. **Flow is automatic** - text reflows continuously as document changes
5. **Direct manipulation** - click in frame to type, drag to resize/move
6. **Rich inline editing** - formatting applied in-place, not via dialogs
7. **Measurement precision** - everything specified in points (1/72 inch)
8. **Style catalogs** - paragraph/character/table formats stored and reusable
9. **Master page inheritance** - layout automatically propagated
10. **Real-time WYSIWYG** - page view matches print output exactly
