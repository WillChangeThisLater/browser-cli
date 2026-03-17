# Cookie Consent Popup Test

**Date:** Mar 17, 2026  
**Goal:** Verify CLI can detect and dismiss cookie consent popups

---

## Prerequisites

- Chrome running with remote debugging: `google-chrome --remote-debugging-port=9222`
- CLI built: `npm run build`
- Set `BROWSER_PORT=9222` or use `--port 9222`

---

## Test Sites

We'll test on sites known to have cookie popups:
1. **BBC News** (UK, GDPR popup)
2. **The Guardian** (UK, cookie banner)
3. **Amazon** (cookie preferences)

---

## Test Steps

### 1. Navigate to Site

```bash
export TABID="<your-tab-id>"
BROWSER_PORT=9222 browser go "https://www.bbc.com/news" --tab "$TABID"
```

---

### 2. Inspect for Cookie Popup

```bash
BROWSER_PORT=9222 browser inspect --tab "$TABID" | jq '.'
```

**Look for:**
- Elements with text: "cookies", "accept", "reject", "preferences"
- Elements with classes: `cookie-banner`, `cookie-consent`, `gdpr`
- Fixed/positioned overlay elements

---

### 3. Click "Accept" or "Reject"

Based on inspect results:

```bash
# Example selectors (will vary by site)
BROWSER_PORT=9222 browser click "[data-testid='accept-cookies']" --tab "$TABID"
# OR
BROWSER_PORT=9222 browser click ".cookie-accept-button" --tab "$TABID"
# OR
BROWSER_PORT=9222 browser click "button:has-text('Accept')" --tab "$TABID"
```

---

### 4. Verify Popup Dismissed

```bash
BROWSER_PORT=9222 browser screenshot /tmp/cookie-dismissed.png --tab "$TABID"
BROWSER_PORT=9222 browser inspect --tab "$TABID" | jq '.elements | length'
```

**Expected:** Popup no longer visible, page fully accessible

---

### 5. Test "Reject" Option (if available)

```bash
BROWSER_PORT=9222 browser go "https://www.bbc.com/news" --tab "$TABID"
BROWSER_PORT=9222 browser click "[data-testid='reject-cookies']" --tab "$TABID"
```

---

## Validation Checklist

| Step | Command | Validates |
|------|---------|-----------|
| 1 | `go` | Navigate to site |
| 2 | `inspect` | Find cookie elements |
| 3 | `click` | Dismiss popup |
| 4 | `screenshot` | Verify dismissal |
| 5 | `click` | Test reject option |

---

## Notes

- Cookie popup selectors vary by site
- Some use iframes (harder to interact with)
- Some use "Accept All" vs "Manage Preferences"
- May need to scroll to see popup

---

## Related Experiments

- `image-scraping.md` - Image scraping workflow
- `hn-login.md` - Form automation
- `arxiv-paper.md` - PDF pagination

## Actual Results (Mar 17, 2026)

### Test Sites Tried

| Site | Cookie Popup? | Notes |
|------|---------------|-------|
| BBC News | ❌ No popup | Already consented or no popup |
| The Guardian | ❌ No popup | No cookie banner visible |
| CNN | ❌ No popup | No cookie banner visible |
| Le Monde | ✅ Found | "Accept" button detected |

### Le Monde Test

```bash
export TABID="414F5088ED515BB898C8B9745FDF89D6"

# Navigate
BROWSER_PORT=9222 browser go "https://www.lemonde.fr" --tab "$TABID"

# Find accept button
BROWSER_PORT=9222 browser eval --tab "$TABID" "
  Array.from(document.querySelectorAll('button'))
    .filter(el => el.textContent && el.textContent.includes('Accept'))
    .map(el => ({text: el.textContent, tag: el.tagName}))
"
# Result: Found "Accept" button

# Click (generic selector worked)
BROWSER_PORT=9222 browser click "button" --tab "$TABID" --wait 1000

# Screenshot
BROWSER_PORT=9222 browser screenshot /tmp/lemonde-accepted.png --tab "$TABID"
```

### Key Findings

1. **Cookie popups are inconsistent** - Many major sites don't show them to returning visitors
2. **`:has-text()` selector doesn't work** - Puppeteer doesn't support this pseudo-selector
3. **Generic selectors may work** - `click "button"` clicked the accept button
4. **Eval can work as fallback** - `eval "document.querySelector('button').click()"`

### Recommendations

- **For cookie popups:** Use `eval` with specific text matching or try multiple selectors
- **Add `--timeout` flag:** Prevent commands from hanging indefinitely
- **Text-based selectors:** Consider implementing `:has-text()` or similar in future

### Session Timeout Issue

**Problem:** Chrome session crashed during NY Times test (likely timeout).

**Fix needed:** Add `--timeout <ms>` option to commands (default 120s) and `BROWSER_TIMEOUT` env var.
