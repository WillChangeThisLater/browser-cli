# Browser CLI Agent Guidelines

## Overview

This is `browser-cli`, a lightweight CLI for browser automation via Puppeteer/Chrome DevTools Protocol (CDP). It provides predefined commands for safe, agent-friendly browser interactions.

**Important:** This tool connects to an EXISTING browser instance. It does NOT launch browsers itself.

---

## Sane Defaults

### Port 9222 (Browser Debugging)

**Always assume the browser is running on port 9222.**

```bash
BROWSER_PORT=9222 browser <command>
```

**DO NOT start a browser yourself.** Memory usage and security concerns prohibit this.

**If port 9222 is not available:**
1. Check: `curl -s http://localhost:9222/json/version`
2. If no response, inform the user and ask them to start Chrome with debugging enabled:
   ```bash
   google-chrome --remote-debugging-port=9222
   ```
3. Do NOT proceed without user intervention.

### Tab Management

**Reuse existing tabs whenever possible.**

- Check available tabs first: `browser tabs --port 9222`
- Reuse the same tab ID across related operations
- Only open new tabs when genuinely needed (cross-referencing, debugging, side-by-side views)
- No hard limit on tabs - use best judgment to keep the workspace functional

### Tab Argument

**Default behavior:** Commands create a new tab if `--tab` is omitted.

**Recommended:** Always specify `--tab <tab-id>` to reuse existing tabs:

```bash
# Creates new tab (not ideal for multi-step tasks)
browser go https://example.com

# Recommended: Reuse same tab across operations
browser go https://example.com --tab abc123
browser type input "text" --tab abc123
browser click button --tab abc123
```

**Why specify `--tab`:** Keeps all related operations in one tab instead of spawning new ones.

Check existing tabs first: `browser tabs --port 9222`

---

## Documentation Pattern

### When to Write Documentation

**Write a `controls.md` file whenever you discover a useful workflow** for a new site.

**Why this matters:** Future agents won't need to rediscover the same patterns, saving time and reducing duplication.

### When to Update Documentation

**Update `controls.md` files when:**

- Selectors change (sites update frequently)
- New reliable patterns are discovered
- Workarounds for issues are found
- Documentation becomes outdated or incorrect

**Why this matters:** Sites change often. Keeping documentation current ensures future agents can work reliably without fighting outdated selectors.

### Where to Write Documentation

**File path:** `docs/controls/<domain>/controls.md`

**Example:**
- `docs/controls/duckduckgo.com/controls.md`
- `docs/controls/github.com/controls.md`
- `docs/controls/npmjs.com/controls.md`

### Documentation Content

Each `controls.md` should cover:

1. **Quick start** - Basic navigation examples
2. **Key selectors** - Important HTML elements
3. **Common patterns** - Search, click, form interactions
4. **Known issues** - Edge cases and workarounds
5. **Screenshot verification** - How to validate page state

**Ask the user before creating/updating documentation files** unless told otherwise.

---

## Best Practices

### Always Verify with Screenshot

**After major navigation or critical operations, ALWAYS take a screenshot to validate:**

```bash
# Standard screenshot
browser screenshot /tmp/verification.png --tab <TAB_ID>

# Full page screenshot
browser screenshot /tmp/full_page.png --full-page --tab <TAB_ID>
```

**Why this matters:**
- Confirms navigation succeeded
- Validates selectors are working
- Catches timing issues before they cause failures
- Provides visual evidence for debugging

**Recommended workflow:**
```bash
# 1. Navigate
browser go https://news.ycombinator.com --tab abc123

# 2. Verify with screenshot
browser screenshot /tmp/verify_hn.png --tab abc123

# 3. Proceed with operations
browser eval "..." --tab abc123
```

### Use Appropriate Timeouts

**Default timeout is 120 seconds (2 minutes) - this is too long for most sites.**

**Recommended:**
- Fast sites (Hacker News, DuckDuckGo): `--timeout 5000` (5 seconds)
- Medium sites: `--timeout 10000` (10 seconds)
- Slow/complex sites: `--timeout 30000` (30 seconds)

```bash
# Fast navigation
browser go https://news.ycombinator.com --timeout 5000 --tab abc123

# Click operations
browser click button --timeout 10000 --tab abc123
```

**Why this matters:**
- Long timeouts encourage agents to wait unnecessarily
- Shorter timeouts fail fast and allow quicker correction
- Most modern sites load in under 5 seconds

### Verify Before Proceeding

**After any operation that should change the page state, verify:**

```bash
# Check current URL
browser eval "window.location.href" --tab <TAB_ID> --json

# Check page title
browser eval "document.title" --tab <TAB_ID> --json

# Check element exists
browser eval "document.querySelector('target-selector') !== null" --tab <TAB_ID> --json
```

### Screenshot Best Practices

1. **Save to /tmp/** - Keep screenshots in `/tmp/` for easy access
2. **Descriptive names** - Use `verify_`, `before_`, `after_` prefixes
3. **Take AFTER navigation** - Never take screenshot before confirming page loaded
4. **Full page for long content** - Use `--full-page` for pages with comments/discussion
5. **Keep tab open** - Screenshots don't close tabs, so you can continue working

### Example Verification Workflow

```bash
# Navigate
browser go https://news.ycombinator.com --timeout 5000 --tab abc123

# Verify navigation succeeded
browser eval "window.location.href" --tab abc123 --json

# Take verification screenshot
browser screenshot /tmp/verify_hn_feed.png --tab abc123

# Now safe to proceed with complex operations
browser eval "(async () => { /* complex operation */ })" --tab abc123 --json
```

---

## Core Commands

### Navigate

```bash
# Direct URL navigation (preferred for searches)
browser go https://duckduckgo.com/?q=search+query

# Navigate to homepage first
browser go https://duckduckgo.com

# Use specific tab
browser go <url> --tab <tab-id>
```

### Type & Submit

```bash
# Type with Enter key
browser type <selector> <text> --enter

# Clear input first
browser type <selector> <text> --clear --enter
```

### Click

```bash
browser click <selector>

# JavaScript click (alternative)
browser eval "(async () => { const link = document.querySelector('a'); if (link) link.click(); })"
```

### Navigation History

```bash
# Go back one page
browser back --tab <tab-id>

# Go forward one page
browser forward --tab <tab-id>

# Useful for undoing navigation mistakes or exploring related pages
```

### Screenshot

```bash
browser screenshot <path> --full-page
```

### JavaScript Evaluation

```bash
browser eval <code> --json
```

---

## Best Practices

1. **Verify browser is running** before starting any task
2. **Check existing tabs** before navigating
3. **Use URL parameters** for searches when possible (more reliable than form submission)
4. **Screenshot after major navigation** to verify success
5. **Use `--json` flag** for programmatic result parsing
6. **Keep documentation updated** when discovering new patterns

---

## Troubleshooting

### "No response on port 9222"

Browser not running. Ask user to start Chrome with debugging:
```bash
google-chrome --remote-debugging-port=9222
```

### "Type operation timeout"

- Use shorter timeouts: `--timeout 5000`
- Use direct URL navigation instead of form submission
- Check element visibility first

### "Execution context was destroyed"

Navigation happened during JavaScript execution. Use `browser go` directly instead of trying to submit forms via eval.

### "Tab not found"

Run `browser tabs --port 9222` to list available tab IDs.

---

## Example Workflow

```bash
# 1. Navigate to DuckDuckGo
browser go https://duckduckgo.com

# 2. Search for "hacker news"
browser go https://duckduckgo.com/?q=hacker+news

# 3. Click first result
browser eval "(async () => {
  const link = document.querySelector('a[href*=\"hackernews.com\"]');
  if (link) link.click();
})"

# 4. Take screenshot
browser screenshot hackernews.png
```

---

## Reference

- **General patterns:** `docs/controls/README.md`
- **Site-specific:** `docs/controls/<domain>/controls.md`
- **Design document:** `DESIGN.md`
