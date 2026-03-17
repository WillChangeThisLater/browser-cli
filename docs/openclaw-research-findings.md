# OpenClaw Browser Integration Research

**Date:** March 16, 2026  
**Goal:** Understand OpenClaw's "secret sauce" for browser automation and extract lessons for our CLI tool.

---

## Executive Summary

OpenClaw's browser integration is **not** fundamentally different from our approach - they use CDP like we do. However, they've built a **more robust architecture** around it with:

1. **Chrome extension** for reliable tab attachment (Browser Relay)
2. **Local gateway service** that manages CDP connections
3. **Profile system** for multiple browser modes
4. **Resilience features** (auto-reconnect, state persistence, keepalive)

**Key insight:** The extension isn't magic - it's a CDP proxy that solves real-world reliability problems we're also hitting.

---

## Architecture Overview

### OpenClaw Components

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Gateway   │────▶│  Browser     │────▶│   Chrome    │
│   (Node)    │     │  Relay       │     │   Browser   │
│             │◀────│  (Extension) │◀────│   (CDP)     │
└─────────────┘     └──────────────┘     └─────────────┘
      │                    │
      │ ws://localhost:    │ chrome.debugger
      │ 18792/extension    │ API
      ▼
┌─────────────┐
│   AI Agent  │
│   (Claude)  │
└─────────────┘
```

### Our CLI (for comparison)

```
┌─────────────┐     ┌─────────────┐
│  CLI Tool   │────▶│   Chrome    │
│  (Puppeteer)│     │   Browser   │
│             │     │   (CDP)     │
└─────────────┘     └─────────────┘
      │
      │ --port 9222
      ▼
┌─────────────┐
│   Chrome    │
│  launched   │
│  with       │
│  --remote-  │
│  debugging- │
│  port=9222  │
└─────────────┘
```

**Difference:** They have a persistent gateway + extension; we're ephemeral CLI.

---

## Key Features We Should Consider

### 1. Browser Relay Extension (Most Important)

**What it does:**
- Uses `chrome.debugger` API to attach to tabs
- Forwards CDP messages to local gateway via WebSocket
- Survives navigation, tab close, service worker restarts

**Why it matters:**
- Direct CDP attach via `--remote-debugging-port` has issues:
  - Chrome may prompt "Allow extension to control browser?"
  - No graceful handling of navigation (target closes)
  - Service worker killed after 30s idle (MV3)

**Extension advantages:**
| Problem | Raw CDP | With Extension |
|---------|---------|----------------|
| Navigation | Target closed, must re-attach | Auto re-attaches |
| Browser restart | Manual reconnect | Auto-reconnect with backoff |
| MV3 service worker death | N/A | State persisted, auto-restore |
| Tab lifecycle | Manual cleanup | Auto-cleanup listeners |
| Idle timeout | Connection drops | Keepalive alarm every 4 min |

**Source:** [`background.js`](https://raw.githubusercontent.com/Unayung/openclaw-browser-relay/master/background.js)

### 2. Profile System

OpenClaw supports multiple browser modes via config:

```json5
{
  browser: {
    defaultProfile: "openclaw",
    profiles: {
      openclaw: { cdpPort: 18800 },           // Managed browser
      user: { driver: "existing-session" },   // Attach to your Chrome
      brave: { driver: "existing-session", userDataDir: "..." },
      remote: { cdpUrl: "http://10.0.0.42:9222" }
    }
  }
}
```

**Profiles:**
- `openclaw` - Launches isolated browser (like our default)
- `user` - Attaches to existing signed-in Chrome (like our `--port 9222`)
- `brave` - Attaches to specific browser profile
- `remote` - Connects to remote CDP endpoint

**Lesson:** We could add profile concept for common scenarios.

### 3. SSRF Protection

OpenClaw has built-in SSRF policy:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true,  // Default: trusted networks
      // hostnameAllowlist: ["*.example.com"],
      // allowedHostnames: ["localhost"]
    }
  }
}
```

**Why:** Agents might navigate to malicious URLs that probe local network.

**Our status:** No SSRF protection. Should add before production use.

### 4. Resilience Patterns

From the Browser Relay extension:

| Feature | Implementation |
|---------|---------------|
| Auto-reconnect | Exponential backoff (1s→2s→4s→...→30s cap) + jitter |
| State persistence | `chrome.storage.session` for MV3 survival |
| Keepalive | `chrome.alarms` every 4 min pings debugger |
| Tab lifecycle | `chrome.tabs.onRemoved`, `onReplaced` listeners |
| Race condition fix | WS handlers installed before connect promise resolves |

**Lesson:** These patterns solve real production issues.

### 5. Remote CDP Support

OpenClaw supports hosted browser services:

```json5
{
  profiles: {
    browserless: { 
      cdpUrl: "https://production-sfo.browserless.io?token=<KEY>" 
    },
    browserbase: { 
      cdpUrl: "wss://connect.browserbase.com?apiKey=<KEY>" 
    }
  }
}
```

**Providers:**
- Browserless (HTTP + token)
- Browserbase (WebSocket + API key)
- Any remote CDP endpoint

---

## What We Learned

### What OpenClaw Does Better

1. **Tab attachment reliability**
   - Extension auto-re-attaches after navigation
   - We currently lose connection on navigation

2. **State persistence**
   - Survives service worker restarts
   - We have no state (ephemeral CLI)

3. **Multiple browser modes**
   - Managed, attach, remote profiles
   - We only have attach mode

4. **SSRF protection**
   - Configurable policy for network access
   - We have none

5. **Keepalive**
   - Prevents idle timeout disconnections
   - We don't handle this

### What We Do Simpler (Advantage?)

1. **No gateway service required**
   - Our CLI is standalone
   - OpenClaw needs Gateway + extension

2. **Direct CDP connection**
   - Less moving parts
   - Works fine for single-shot commands

3. **No config files**
   - Everything via CLI flags
   - OpenClaw requires `~/.openclaw/openclaw.json`

---

## Recommendations for Our CLI

### High Priority (Should Implement)

#### 1. Add SSRF Policy

```bash
browser go example.com --ssrf-policy strict
browser go example.com --allow-private-network
```

**Why:** Safety for agent use. Prevents accidental local network probes.

#### 2. Improve Navigation Handling

When page navigates, our session breaks. Options:
- Wait for navigation to complete before detaching
- Add `--wait-navigation` flag
- Auto re-attach after navigation (like extension does)

**Fix:**
```typescript
// In closeSession, check if navigation happened
if (navigationDetected) {
  await page.waitForNavigation({ timeout: 5000 });
}
```

#### 3. Add Browser Profiles Concept

```bash
browser go example.com --profile managed    # Launch new browser
browser go example.com --profile user       # Attach to existing Chrome
browser go example.com --profile remote --cdp-url http://...
```

**Why:** Makes common scenarios explicit.

### Medium Priority (Nice to Have)

#### 4. Add `--persistent` Mode

Keep browser open after command completes:

```bash
browser go example.com --persistent --port-file /tmp/browser-port
# Browser stays open
browser click "#btn" --port-file /tmp/browser-port
browser disconnect  # Explicit close
```

**Why:** Enables multi-command workflows without `--tab` tracking.

#### 5. Add Connection Resilience

```bash
browser go example.com --retry 3 --retry-delay 1000
```

**Why:** Handles transient connection failures.

#### 6. Support Remote CDP

```bash
browser go example.com --cdp-url wss://connect.browserless.io?token=xxx
```

**Why:** Enables cloud browser services.

### Low Priority (Future)

#### 7. Chrome Extension (Optional)

Build a simple extension that:
- Exposes CDP via local WebSocket
- Handles tab attachment more reliably
- No gateway service needed

**Why:** Solves the "Allow extension to control browser?" prompt and navigation issues.

**Tradeoff:** More complexity to maintain.

---

## Code Snippets to Steal

### Auto-reconnect with backoff (from Browser Relay)

```javascript
let reconnectAttempt = 0

async function reconnect() {
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000)
  reconnectAttempt++
  setTimeout(tryConnect, delay + Math.random() * 1000)
}
```

### Tab lifecycle cleanup

```javascript
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabs.has(tabId)) {
    cleanupTab(tabId)
  }
})

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  if (tabs.has(removedTabId)) {
    cleanupTab(removedTabId)
  }
})
```

### Keepalive alarm (MV3 service worker)

```javascript
chrome.alarms.create('keepalive', { periodInMinutes: 4 })

chrome.alarms.onAlarm.addListener(async () => {
  for (const [tabId, session] of tabs) {
    await chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
      expression: '"keepalive"'
    })
  }
})
```

---

## Testing Our CLI Against OpenClaw Claims

### Claim: "Survives navigation"

**Test:** Navigate, then click link that causes navigation.

**Our result:** Session detaches cleanly, but new page not automatically tracked. Need to use `--tab` with same ID (works because tab stays open).

**Verdict:** ✅ Works, but requires explicit tab management.

### Claim: "Auto-reconnect on gateway restart"

**Our architecture:** No gateway, so N/A.

**Verdict:** N/A

### Claim: "MV3 service worker survival"

**Our architecture:** CLI is ephemeral, no service worker.

**Verdict:** N/A

### Claim: "SSRF-guarded navigation"

**Test:** Try to navigate to `http://localhost:9222` or `http://169.254.169.254`.

**Our result:** No protection - would succeed.

**Verdict:** ❌ Missing. Should add.

---

## Conclusion

OpenClaw's "secret sauce" is **not** a technical breakthrough - it's **engineering for reliability**:

1. Extension handles edge cases (navigation, restarts, idle timeout)
2. Gateway manages state and reconnection
3. Profile system for different use cases
4. SSRF protection for safety

**For our CLI:**
- We don't need extension or gateway for basic use
- We **should** add SSRF protection
- We **should** improve navigation handling
- We **could** add profile concept for clarity

**Bottom line:** Our CLI is simpler and works well for agent workflows. The missing pieces are about production hardening, not fundamental capability.

---

## References

- [OpenClaw Browser Relay (fork)](https://github.com/Unayung/openclaw-browser-relay)
- [OpenClaw Browser Docs](https://docs.openclaw.ai/tools/browser)
- [OpenClaw Chrome Extension](https://chromewebstore.google.com/detail/openclaw-browser-relay/bobkbcmgacnlomccmnaglobifoljcghb)
- [HN Discussion](https://hn.algolia.com/?q=openclaw+browser)
