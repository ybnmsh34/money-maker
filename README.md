# Easy File Tools — Free Online File Conversion & Editing

A modern, fast, and private online file conversion platform. All processing happens in your browser — no server uploads, no data collection.

**Live:** https://ybnmsh34.github.io/easyfiletools/

---

## Tools

| Tool | Status | Description |
|------|--------|-------------|
| **PDF Editor** | ✅ Live | Edit text, add/delete spans, 17 fonts, RTL/Hebrew, export with custom fonts |
| **PDF Compressor** | ✅ Live | Reduce PDF file size |
| **PDF Merge** | ✅ Live | Combine multiple PDFs into one |
| **PDF Split** | ✅ Live | Split a PDF into multiple files |
| **PDF to Image** | ✅ Live | Convert PDF pages to images |
| **PDF to Word** | ✅ Live | Convert PDF to editable Word document |
| **Image to PDF** | ✅ Live | Combine images into a single PDF |
| **Image Compressor** | ✅ Live | Reduce image file size |
| **Image Resizer** | ✅ Live | Resize images for web/social media |
| **QR Code Generator** | ✅ Live | Generate QR codes from text/URLs |

---

## PDF Editor — Features

The **PDF Editor** is a full-featured client-side editor with Word-like editing behavior:

### Editing
- **Inline text editing** — Double-click any text to edit directly on the page
- **Enter splits lines** — Press Enter to split text at cursor, pushing content down (no overlap)
- **Backspace merges** — Backspace at start of line merges with previous span
- **Double-click empty area** — Create new text lines anywhere on the page
- **Auto page creation** — Content overflowing the last page cascades to a new page automatically

### RTL / Hebrew / Bidi
- **RTL support** — Full right-to-left text editing with proper cursor behavior
- **Hebrew font** — Noto Sans Hebrew (Regular + Bold) bundled and ready
- **Bidi text** — Bidirectional text rendering via bidi-js (digits in Hebrew preserved)
- **Arabic detection** — Arabic text is blocked at export (no shaping engine)
- **Direction toggle** — Switch between LTR and RTL from the toolbar

### Fonts (17 total)
- **Sans-serif:** Helvetica, Roboto, Open Sans, Lato, Montserrat, Raleway, PT Sans, Nunito, Poppins
- **Serif:** Times New Roman, Playfair Display, Merriweather, Lora
- **Monospace:** Courier, Fira Code, IBM Plex Mono
- **Script:** Dancing Script

All fonts work in-browser (Google Fonts CDN) and in exported PDFs (embedded TTF via fontkit).

### Export
- **White-out / redraw** — Clean export that replaces original text
- **Custom fonts in PDF** — Selected fonts are embedded in the exported PDF
- **Dynamic pages** — New pages created during editing are included in export
- **Style preservation** — Bold, italic, underline, color, and font preserved

### UI
- **Zoom** — Zoom in/out with toolbar buttons
- **Thumbnails** — Page thumbnails panel for navigation
- **Change tracking** — Visual indicator for modified text (green background)
- **Color picker** — Full color support for text
- **1-inch margins** — Standard Word/Google Docs margin behavior

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Vanilla JavaScript (no framework) |
| **PDF Parsing** | PDF.js |
| **PDF Generation** | pdf-lib + @pdf-lib/fontkit |
| **Fonts** | Google Fonts CDN (display) + bundled TTF (export) |
| **Bidi** | bidi-js (CDN) |
| **Testing** | Puppeteer |
| **Server** | Node.js + Express (dev only) |

---

## Local Development

```bash
cd money-maker
npm install
npm start
```

Open http://localhost:3000

---

## Testing

The PDF Editor has a comprehensive Puppeteer test suite (71 tests):

| Test Suite | Tests | Description |
|-----------|-------|-------------|
| Phase 1: Bounds | 4 | getPageBounds, EDGE_PAD, page dimensions |
| Phase 2: Direction | 5 | RTL/LTR detection, toolbar toggle, positioning |
| Phase 3: Overflow | 3 | Word-boundary wrapping, cascade to new pages |
| Phase 4: Clamp | 4 | Boundary clamping for span creation |
| Phase 5: Containment | 3 | Visual containment, edge guide |
| Phase 6: Export | 5 | Bidi, Arabic detection, font loading, boundaries |
| Phase 7: Comprehensive | 21 | Full regression across all phases |
| Phase 7: Edge Cases | 9 | Single-char, empty spans, unbreakable words, zoom |
| Phase 7: Export Roundtrip | 6 | Hebrew, Arabic, LTR, bold, mixed LTR/RTL |
| Color Fix | 5 | Color picker after blur, cross-span, persistence |
| Fonts | 10 | Dropdown options, font application, inheritance, URL structure |
| 5 Fixes | 5 | Margins, toolbar focus, backspace, line spacing, style |
| **Total** | **71** | **100% pass** |

```bash
# Run all tests
node test-scripts/test-phase7-comprehensive.js
node test-scripts/test-phase7-edge-cases.js
node test-scripts/test-phase7-export-roundtrip.js
node test-scripts/test-color-fix.js
node test-scripts/test-fonts-comprehensive.js
node test-scripts/test-all-5-fixes.js
```

---

## Deployment

### GitHub Pages (Current)

The site is deployed via GitHub Pages from the `gh-pages` branch.

```bash
# Deploy to GitHub Pages
git push origin master
git checkout gh-pages && git merge master --no-edit && git push origin gh-pages
git checkout master
```

Site: https://ybnmsh34.github.io/easyfiletools/

---

## Architecture

### PDF Editor Flow

```
Upload PDF → PDF.js parses → Build HTML overlay (spans) → Edit inline → Export (pdf-lib)
```

### Span Model

Each text line is a `<span class="text-span" contenteditable>` with `_meta`:

```javascript
_meta: {
  pageNum,      // Page number (1-indexed)
  x,            // X position (or anchorRight for RTL)
  y,            // Y position (baseline)
  fontSize,     // Font size in points
  fontName,     // Original PDF font name
  fontType,     // Current font type (e.g., 'roboto', 'helvetica')
  width,        // Computed span width
  height,       // Computed span height (fontSize)
  leading,      // Line spacing (from PDF inter-line gaps)
  isBold,       // Boolean
  isItalic,     // Boolean
  hasUnderline, // Boolean
  dir           // 'ltr' or 'rtl'
}
```

New spans are marked with `data-new-text="true"`.

---

## License

MIT
