# Tab Navigation & Screenshot Workflow Test

A reproducible end-to-end test for the browser CLI. Run this workflow to validate core functionality after changes.

## Prerequisites

- Chrome/Chromium running with remote debugging enabled:
  ```bash
  google-chrome --remote-debugging-port=9222
  ```
- At least one tab open in Chrome
- CLI built and available: `npm run build`

## Test Steps

### 1. List Open Tabs

Verify you can discover existing tabs:

```bash
browser tabs --port 9222
```

**Expected output:**
```json
{"success":true,"tabs":[{"id":"...","title":"...","url":"...","type":"page"},...]}
```

**Validate:**
- Response is valid JSON
- `success` is `true`
- At least one tab in the array
- Each tab has `id`, `title`, `url`, `type` fields

---

### 2. Navigate to Bing (Using Existing Tab)

Capture the first tab ID and navigate:

```bash
TABID="$(browser tabs --port 9222 | jq -r '.tabs[0].id')"
browser go bing.com --tab "$TABID" --port 9222
```

**Expected output:**
```json
{"success":true,"tabId":"...","url":"https://bing.com","title":"Search - Microsoft Bing","finalUrl":"..."}
```

**Validate:**
- `success` is `true`
- `tabId` matches the one you passed
- `url` contains `bing.com`
- `title` indicates Bing search page

---

### 3. Screenshot Bing

Capture the page:

```bash
browser screenshot /tmp/bing-screenshot.png --tab "$TABID" --port 9222
```

**Expected output:**
```json
{"success":true,"tabId":"...","path":"/tmp/bing-screenshot.png","size":...,"sizeKB":"...","fullPage":false,"type":"png","url":"...","title":"..."}
```

**Validate:**
- File exists at `/tmp/bing-screenshot.png`
- File size is reasonable (>100KB)
- `success` is `true`
- `path` matches what you requested

**Visual check:** Open the screenshot and verify it shows the Bing homepage.

---

### 4. Navigate to Hacker News (Same Tab)

Reuse the same tab ID:

```bash
browser go news.ycombinator.com --tab "$TABID" --port 9222
```

**Expected output:**
```json
{"success":true,"tabId":"...","url":"https://news.ycombinator.com","title":"Hacker News","finalUrl":"..."}
```

**Validate:**
- `success` is `true`
- Same `tabId` as before (confirming tab reuse)
- `title` is "Hacker News"

---

### 5. Screenshot Hacker News

```bash
browser screenshot /tmp/hn-screenshot.png --tab "$TABID" --port 9222
```

**Expected output:**
```json
{"success":true,"tabId":"...","path":"/tmp/hn-screenshot.png","size":...,"sizeKB":"...","fullPage":false,"type":"png","url":"...","title":"Hacker News"}
```

**Validate:**
- File exists at `/tmp/hn-screenshot.png`
- `success` is `true`

**Visual check:** Open the screenshot and verify it shows the HN front page.

**Bonus:** Identify the #1 post title from the screenshot.

---

## Test Checklist

| Step | Command | Validates |
|------|---------|-----------|
| 1 | `tabs` | Tab discovery, JSON output |
| 2 | `go` (Bing) | Navigation, tab attachment |
| 3 | `screenshot` (Bing) | Screenshot capture, file I/O |
| 4 | `go` (HN) | Tab reuse, navigation |
| 5 | `screenshot` (HN) | Multiple screenshots, same tab |

## Cleanup

```bash
rm /tmp/bing-screenshot.png /tmp/hn-screenshot.png
```

## Troubleshooting

**Error: `tabId requires --port or --ws`**
- You forgot to pass `--port 9222` along with `--tab`

**Error: `Tab ... not found`**
- The tab was closed. Run `browser tabs --port 9222` to get a fresh tab ID.

**Error: `ECONNREFUSED`**
- Chrome isn't running with `--remote-debugging-port=9222`

**Puppeteer error: `executablePath`**
- You're trying to launch a new browser without `--port`. This CLI is designed to connect to existing Chrome instances.

## Notes

- All commands output JSON to stdout (for parsing)
- Logs go to stderr (won't interfere with JSON parsing)
- The `--tab` flag is key for multi-step workflows
- Tabs stay open after CLI exits (detach, not close)
