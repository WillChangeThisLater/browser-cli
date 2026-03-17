# Hacker News Login Form Test

**Date:** Mar 17, 2026  
**Goal:** Verify form automation (type + click) by attempting to log in to Hacker News with invalid credentials

---

## Prerequisites

- Chrome running with remote debugging: `google-chrome --remote-debugging-port=9222`
- CLI built: `npm run build`
- Set `BROWSER_PORT=9222` or use `--port 9222`

---

## Test Credentials

- **Username:** `1234` (invalid)
- **Password:** `password` (invalid)

**Expected Result:** Login should fail, but we verify we can type and click successfully.

---

## Test Steps

### 1. Navigate to HN Login

```bash
export TABID="<your-tab-id>"
BROWSER_PORT=9222 browser go "https://news.ycombinator.com/login" --tab "$TABID"
```

---

### 2. Inspect Login Form

Find the username, password, and submit elements:

```bash
BROWSER_PORT=9222 browser inspect --tab "$TABID" | jq '.'
```

**Expected:** Find `<form>` with `name="acct"`, `<input name="acct">`, `<input name="pw">`, and submit button.

---

### 3. Type Username

```bash
BROWSER_PORT=9222 browser type "input[name='acct']" "1234" --tab "$TABID"
```

**Expected:** Username field filled with "1234"

---

### 4. Type Password

```bash
BROWSER_PORT=9222 browser type "input[name='pw']" "password" --tab "$TABID"
```

**Expected:** Password field filled (shown as dots)

---

### 5. Submit Form

```bash
BROWSER_PORT=9222 browser click "input[type='submit']" --tab "$TABID" --wait 1000
```

**Expected:** Form submitted, page reloads with error message

---

### 6. Verify Login Failed

Check page for error message:

```bash
BROWSER_PORT=9222 browser eval --tab "$TABID" "document.body.innerText"
```

**Expected:** Error message like "Login failed" or similar

---

### 7. Screenshot for Verification

```bash
BROWSER_PORT=9222 browser screenshot /tmp/hn-login-attempt.png --tab "$TABID"
```

**Expected:** Screenshot showing login form with filled fields and error message

---

## Validation Checklist

| Step | Command | Validates |
|------|---------|-----------|
| 1 | `go` | Navigate to HN login |
| 2 | `inspect` | Discover form elements |
| 3 | `type` | Fill username field |
| 4 | `type` | Fill password field |
| 5 | `click` | Submit form |
| 6 | `eval` | Verify error message |
| 7 | `screenshot` | Visual confirmation |

---

## Notes

- Hacker News login is simple (no CAPTCHA, no 2FA)
- Invalid credentials should fail but confirm form works
- If login unexpectedly succeeds, verify we're not on a test account

---

## Related Experiments

- `image-scraping.md` - Image scraping workflow
- `tab-navigation-screenshot.md` - Basic tab navigation

## Actual Results (Mar 17, 2026)

**All steps completed successfully!**

```bash
export TABID="AD5A2F847F43FD5D9ECB7258EC1C301B"

# Navigate
BROWSER_PORT=9222 browser go "https://news.ycombinator.com/login" --tab "$TABID"

# Inspect to find selectors
BROWSER_PORT=9222 browser inspect --tab "$TABID"

# Type credentials
BROWSER_PORT=9222 browser type "input[name='acct']" "1234" --tab "$TABID"
BROWSER_PORT=9222 browser type "input[name='pw']" "password" --tab "$TABID"

# Submit
BROWSER_PORT=9222 browser click "input[type='submit']" --tab "$TABID" --wait 2000

# Verify error
BROWSER_PORT=9222 browser eval --tab "$TABID" "document.body.innerText"
# Result: "Bad login."

# Screenshot
BROWSER_PORT=9222 browser screenshot /tmp/hn-login-attempt.png --tab "$TABID"
```

**Results:**
- ✅ Username field filled successfully
- ✅ Password field filled successfully
- ✅ Submit button clicked successfully
- ✅ Login failed with expected "Bad login." error
- ✅ Screenshot saved to `/tmp/hn-login-attempt.png`

**Conclusion:** The `type` and `click` commands work perfectly for form automation!
