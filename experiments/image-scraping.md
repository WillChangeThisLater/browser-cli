# Image Scraping Experiment

**Date:** Mar 17, 2026  
**Goal:** Scrape the first 10 images from a webpage using the browser CLI

---

## Prerequisites

- Chrome/Chromium running with remote debugging enabled:
  ```bash
  google-chrome --remote-debugging-port=9222
  ```
- CLI built and available: `npm run build`
- At least one tab open in Chrome

**Note:** Set `BROWSER_PORT=9222` env var or always pass `--port 9222` explicitly.

---

## Test Workflow

### 1. Navigate to DuckDuckGo Images

```bash
TABID="$(browser tabs --port 9222 | jq -r '.tabs[0].id')"
browser go https://duckduckgo.com --tab "$TABID" --port 9222
```

**Expected:** Navigate to DuckDuckGo homepage

---

### 2. Search for Images

First, inspect to find the search input:

```bash
browser inspect --tab "$TABID" --port 9222 | jq '.elements[] | select(.tag == "input" and .type == "text")'
```

Type the search query:

```bash
browser type "input[type='text']" "cats" --tab "$TABID" --port 9222 --enter
```

**Expected:** Search results page with images

---

### 3. Switch to Images Tab

DuckDuckGo has navigation tabs. Inspect to find the Images tab:

```bash
browser inspect --tab "$TABID" --port 9222 | jq '.elements[] | select(.text | contains("Images"))'
```

Click the Images tab (you'll need the selector from above):

```bash
browser click "[href*='images']" --tab "$TABID" --port 9222 --wait 1000
```

**Expected:** Images search results page

---

### 4. Inspect Image Elements

Find all `<img>` elements on the page:

```bash
browser eval --tab "$TABID" --port 9222 "
  Array.from(document.querySelectorAll('img')).slice(0, 10).map(img => ({
    src: img.src,
    alt: img.alt,
    width: img.naturalWidth,
    height: img.naturalHeight
  }))
"
```

**Expected:** JSON array of 10 image objects with src, alt, width, height

---

### 5. Save Image URLs to File

Capture and save to a file:

```bash
browser eval --tab "$TABID" --port 9222 "
  JSON.stringify(Array.from(document.querySelectorAll('img')).slice(0, 10).map(img => img.src))
" > /tmp/image-urls.txt
```

Verify the output:

```bash
cat /tmp/image-urls.txt | jq .
```

**Expected:** JSON array of 10 image URLs

---

### 6. Screenshot for Verification

Take a screenshot to visually confirm the images:

```bash
browser screenshot /tmp/image-scrape-verification.png --tab "$TABID" --port 9222
```

**Expected:** Screenshot file showing image results

---

### 7. (Optional) Download First Image

Use curl to download the first image:

```bash
FIRST_URL="$(cat /tmp/image-urls.txt | jq -r '.[0]')"
curl -o /tmp/first-image.jpg "$FIRST_URL"
file /tmp/first-image.jpg
```

**Expected:** Valid image file

---

## Complete Script

Save this as a reusable script:

```bash
#!/bin/bash
# scrape-images.sh - Scrape first 10 images from DuckDuckGo

set -e

# Ensure Chrome is running with remote debugging
# google-chrome --remote-debugging-port=9222

# Get first tab
TABID="$(browser tabs --port 9222 | jq -r '.tabs[0].id')"

# Navigate and search
browser go https://duckduckgo.com --tab "$TABID" --port 9222
browser type "input[type='text']" "cats" --tab "$TABID" --port 9222 --enter
browser click "[href*='images']" --tab "$TABID" --port 9222 --wait 1000

# Extract image URLs
browser eval --tab "$TABID" --port 9222 "
  JSON.stringify(Array.from(document.querySelectorAll('img')).slice(0, 10).map(img => ({
    src: img.src,
    alt: img.alt,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height
  })))
" | jq . > /tmp/image-data.json

# Screenshot for verification
browser screenshot /tmp/image-scrape-verification.png --tab "$TABID" --port 9222

echo "✅ Scraped 10 images to /tmp/image-data.json"
echo "📸 Screenshot saved to /tmp/image-scrape-verification.png"
```

---

## Validation Checklist

| Step | Command | Validates |
|------|---------|-----------|
| 1 | `go` | Navigation to DuckDuckGo |
| 2 | `type` + `enter` | Search functionality |
| 3 | `click` | Tab navigation (Images) |
| 4 | `eval` | Image extraction via JS |
| 5 | File I/O | Save URLs to file |
| 6 | `screenshot` | Visual verification |
| 7 | `curl` | Optional download test |

---

## Expected Output

**image-data.json:**
```json
[
  {
    "src": "https://images.duckduckgo.com/iu/?u=...",
    "alt": "Cat image",
    "width": 300,
    "height": 200
  },
  ...
]
```

---

## Troubleshooting

**Error: `Element not found`**
- Selectors may have changed. Run `browser inspect` to find current selectors.

**Error: `Tab not found`**
- Chrome may have restarted. Run `browser tabs --port 9222` for fresh tab ID.

**Images not loading:**
- DuckDuckGo may lazy-load images. Try `browser scroll down --tab "$TABID" --port 9222` before scraping.

**Empty results from `eval`:**
- Page may not have loaded. Add `--wait 2000` after navigation.
- Selector may be wrong. Use `browser inspect --all` to see all elements.

---

## Variations

### Alternative Sites

**Unsplash (pure image site):**
```bash
browser go https://unsplash.com/s/photos/cats --tab "$TABID" --port 9222
```

**Flickr:**
```bash
browser go https://www.flickr.com/search/?text=cats --tab "$TABID" --port 9222
```

### Extract Different Data

```bash
browser eval --tab "$TABID" --port 9222 "
  Array.from(document.querySelectorAll('img')).slice(0, 10).map(img => ({
    src: img.src,
    alt: img.alt,
    title: img.title,
    parent: img.parentElement?.tagName,
    href: img.closest('a')?.href
  }))
"
```

---

## Notes

- DuckDuckGo uses lazy-loading, so images may not have `src` initially
- Consider using `data-src` or `data-lazy-src` for lazy-loaded images
- Some sites have anti-scraping measures; test on permissive sites first
- Respect robots.txt and terms of service

---

## Related Experiments

- `tab-navigation-screenshot.md` - Basic tab and screenshot workflow
- `docs/live-test-findings.md` - Inspect and scroll command findings

## Actual Results (Mar 17, 2026)

**Site used:** Bing Images (DuckDuckGo had lazy-loading issues)

**Commands that worked:**
```bash
export TABID="AD5A2F847F43FD5D9ECB7258EC1C301B"

# Navigate
BROWSER_PORT=9222 browser go "https://www.bing.com/images/search?q=cats" --tab "$TABID"

# Scroll to load images
for i in 1 2 3; do
  BROWSER_PORT=9222 browser scroll down --tab "$TABID"
  sleep 1
done

# Extract images (filter out SVGs and data URLs)
BROWSER_PORT=9222 browser eval --tab "$TABID" "
  Array.from(document.querySelectorAll('img'))
    .filter(img => img.src && !img.src.includes('.svg') && !img.src.startsWith('data:'))
    .slice(0, 10)
    .map(img => img.src)
"

# Screenshot
BROWSER_PORT=9222 browser screenshot /tmp/bing-cats-screenshot.png --tab "$TABID"
```

**Output:** 10 cat image URLs saved to `/tmp/image-urls.txt`
**Screenshot:** `/tmp/bing-cats-screenshot.png` (440 KB)

**Note:** Bing Images works better than DuckDuckGo for this experiment due to simpler image loading.
