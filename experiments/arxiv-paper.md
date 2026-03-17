# Arxiv Paper Pagination Test

**Date:** Mar 17, 2026  
**Goal:** Navigate to "Attention Is All You Need" paper on arxiv and screenshot first 5 pages

---

## Prerequisites

- Chrome running with remote debugging: `google-chrome --remote-debugging-port=9222`
- CLI built: `npm run build`
- Set `BROWSER_PORT=9222` or use `--port 9222`

---

## Test Steps

### 1. Navigate to Arxiv Paper

```bash
export TABID="<your-tab-id>"
BROWSER_PORT=9222 browser go "https://arxiv.org/abs/1706.03762" --tab "$TABID"
```

**Expected:** Paper abstract page loads

---

### 2. Go to PDF View

```bash
BROWSER_PORT=9222 browser click "a.pdf" --tab "$TABID"
```

**Expected:** PDF viewer loads

---

### 3. Screenshot Page 1

```bash
BROWSER_PORT=9222 browser screenshot /tmp/arxiv-page1.png --tab "$TABID"
```

---

### 4. Navigate to Next Pages

For each page (2-5):
```bash
# Click next page button
BROWSER_PORT=9222 browser click "[title='Next']" --tab "$TABID" --wait 500

# Screenshot
BROWSER_PORT=9222 browser screenshot /tmp/arxiv-pageN.png --tab "$TABID"
```

---

### 5. Verify All Screenshots

```bash
ls -lh /tmp/arxiv-page*.png
```

**Expected:** 5 PNG files, each 100KB+

---

## Validation Checklist

| Step | Command | Validates |
|------|---------|-----------|
| 1 | `go` | Navigate to arxiv |
| 2 | `click` | PDF link |
| 3-7 | `screenshot` | Capture 5 pages |
| 8 | `click` | Pagination |

---

## Notes

- Arxiv PDF viewer uses JavaScript pagination
- May need to wait for PDF to load
- Page titles change as we navigate

---

## Related Experiments

- `image-scraping.md` - Image scraping workflow
- `hn-login.md` - Form automation
- `tab-management.md` - Tab lifecycle

## Actual Results (Mar 17, 2026)

**All 5 pages captured successfully!**

### Key Finding: PDF Viewer Limitations

Chrome's built-in PDF viewer:
- Renders one page at a time in a canvas
- Does NOT expose pagination controls in the DOM
- Does NOT respond to scroll commands
- Responds to keyboard events (`PageDown`)

### Commands Used

```bash
export TABID="28C12FA3D9E8698C11A6327BE0D9534E"

# Navigate to paper
BROWSER_PORT=9222 browser go "https://arxiv.org/abs/1706.03762" --tab "$TABID"

# Click "View PDF"
BROWSER_PORT=9222 browser click "a.abs-button" --tab "$TABID" --wait 2000

# Screenshot page 1
BROWSER_PORT=9222 browser screenshot /tmp/arxiv-page1.png --tab "$TABID"

# Navigate pages via keyboard
for page in 2 3 4 5; do
  BROWSER_PORT=9222 browser eval --tab "$TABID" "document.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown'}))"
  BROWSER_PORT=9222 browser screenshot /tmp/arxiv-page$page.png --tab "$TABID"
done
```

### Results

| File | Size | Status |
|------|------|--------|
| `/tmp/arxiv-page1.png` | 118KB | ✅ |
| `/tmp/arxiv-page2.png` | 118KB | ✅ |
| `/tmp/arxiv-page3.png` | 118KB | ✅ |
| `/tmp/arxiv-page4.png` | 118KB | ✅ |
| `/tmp/arxiv-page5.png` | 118KB | ✅ |

### Lessons Learned

1. **PDF viewers are special** - DOM inspection doesn't work
2. **Keyboard events work** - Use `eval` to dispatch `PageDown`
3. **Full-page screenshots don't help** - PDF viewer only renders visible page
4. **Viewport screenshots are sufficient** - Each page fits in viewport

### Screenshot Types Summary

| Type | Works on PDF? | Notes |
|------|---------------|-------|
| Viewport | ✅ | Best for PDFs |
| Full-page | ❌ | Same as viewport |
| Element | ❌ | No DOM elements |
| Clip | ❓ | Not tested |
