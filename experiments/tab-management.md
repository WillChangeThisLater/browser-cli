# Tab Management Test

**Date:** Mar 17, 2026  
**Goal:** Verify tab lifecycle management (open, list, close)

---

## Prerequisites

- Chrome running with remote debugging: `google-chrome --remote-debugging-port=9222`
- CLI built: `npm run build`
- Set `BROWSER_PORT=9222` or use `--port 9222`

---

## Test Steps

### 1. List Existing Tabs

```bash
BROWSER_PORT=9222 browser tabs
```

**Expected:** JSON array of open tabs

---

### 2. Navigate to Google (Tab 1)

```bash
export TABID="$(BROWSER_PORT=9222 browser tabs | jq -r '.tabs[0].id')"
BROWSER_PORT=9222 browser go "https://www.google.com" --tab "$TABID"
```

**Expected:** Tab navigated to Google

---

### 3. Navigate to DuckDuckGo (Tab 2)

Create a new tab by connecting without specifying tab ID:

```bash
BROWSER_PORT=9222 browser go "https://www.duckduckgo.com"
```

**Expected:** New tab created and navigated to DuckDuckGo

---

### 4. List Tabs Again

```bash
BROWSER_PORT=9222 browser tabs
```

**Expected:** Two tabs visible (Google and DuckDuckGo)

---

### 5. Close Google Tab

```bash
BROWSER_PORT=9222 browser close --tab "$TABID"
```

**Expected:** Tab closed successfully

---

### 6. Verify Tab Closed

```bash
BROWSER_PORT=9222 browser tabs
```

**Expected:** Google tab no longer visible

---

## Validation Checklist

| Step | Command | Validates |
|------|---------|-----------|
| 1 | `tabs` | List existing tabs |
| 2 | `go` (first tab) | Navigate existing tab |
| 3 | `go` (new tab) | Create new tab |
| 4 | `tabs` | Verify both tabs exist |
| 5 | `close` | Close specific tab |
| 6 | `tabs` | Verify tab removed |

---

## Related Experiments

- `image-scraping.md` - Image scraping workflow
- `hn-login.md` - Form automation
- `tab-navigation-screenshot.md` - Basic tab navigation

## Actual Results (Mar 17, 2026)

**All steps completed successfully!**

```bash
# Step 1: List tabs
BROWSER_PORT=9222 browser tabs | jq '.tabs | length'
# Result: 17 tabs

# Step 2: Navigate existing tab to Google
export GOOGLE_TAB="AD5A2F847F43FD5D9ECB7258EC1C301B"
BROWSER_PORT=9222 browser go "https://www.google.com" --tab "$GOOGLE_TAB"
# Result: Navigated to Google

# Step 3: Create new tab to DuckDuckGo
BROWSER_PORT=9222 browser go "https://www.duckduckgo.com"
# Result: New tab created (ID: 28C12FA3...)

# Step 4: List tabs
BROWSER_PORT=9222 browser tabs | jq '.tabs[] | select(.title | contains("Google") or contains("DuckDuckGo"))'
# Result: Both tabs visible

# Step 5: Close Google tab
BROWSER_PORT=9222 browser close --tab "$GOOGLE_TAB"
# Result: {"success":true,"tabId":"","action":"closed"}

# Step 6: Verify
BROWSER_PORT=9222 browser tabs | jq '.tabs[] | select(.title == "Google")'
# Result: Tab no longer visible ✅
```

**Results:**
- ✅ Tab navigation works
- ✅ New tab creation works
- ✅ Tab listing works
- ✅ Tab closing works
- ⚠️ Response shows empty tabId (cosmetic bug, doesn't affect functionality)

**Conclusion:** Tab management commands work correctly!
