# Future Improvement: ARIA-Based Element Selection

**Date:** March 16, 2026  
**Priority:** High  
**Status:** Research phase

---

## Problem

Current `inspect` command returns CSS selectors that are often fragile:

```json
{
  "selector": "button.header_headerButton__InWgw",
  "tag": "button",
  "text": "Menu"
}
```

**Issues:**
- Obfuscated class names (CSS modules, Tailwind, etc.)
- Auto-generated IDs in React/SPAs
- Selectors break on minor UI updates

---

## Proposed Solution: ARIA/Semantic Selectors

Use ARIA roles and accessible names as primary selectors:

```json
{
  "selector": "button.header_headerButton__InWgw",
  "aria": {
    "role": "button",
    "label": "Open menu",
    "name": "Menu"
  },
  "tag": "button",
  "text": "Menu"
}
```

**Agent could then use:**
```bash
browser click "button[name='Menu']" --tab abc123
browser click "[role='button'][name='Submit']" --tab abc123
browser click "[aria-label='Search']" --tab abc123
```

---

## Research Sources

### HN Discussion: webctl (ARIA-based browser automation)
- **Thread:** [Show HN: Webctl – Browser automation for agents based on CLI instead of MCP](https://news.ycombinator.com/item?id=46616481)
- **Key insight from creator:**
  > "In React apps, the raw DOM structure and auto-generated IDs shift so frequently that a script generated from 'Raw HTML' often breaks 10 minutes later. **I found ARIA/semantics to be the only stable contract that persists across re-renders.**"
- **Creator:** [@cosinusalpha](https://github.com/cosinusalpha/webctl)
- **Repo:** https://github.com/cosinusalpha/webctl

### Related: Browser Use
- **Comment from Browser Use creator:**
  > "One idea we have been playing around with a lot is just giving the LLM raw html and a really good way to traverse it - no heuristics, just BS4. Seems to work well, but much more expensive than the current prod ready [index]<div ... notation"
- **Thread:** Same as above (nested comment)

---

## Implementation Plan

### Phase 1: Add ARIA Attributes to `inspect` Output

Modify `browser-cli/src/commands/inspect.ts`:

```typescript
// For each interactive element, also extract:
const ariaInfo = await page.evaluate((el: HTMLElement) => {
  return {
    role: el.getAttribute('role'),
    ariaLabel: el.getAttribute('aria-label'),
    ariaLabelledBy: el.getAttribute('aria-labelledby'),
    ariaDescribedBy: el.getAttribute('aria-describedby'),
    ariaExpanded: el.getAttribute('aria-expanded'),
    ariaPressed: el.getAttribute('aria-pressed'),
    ariaSelected: el.getAttribute('aria-selected'),
    ariaChecked: el.getAttribute('aria-checked'),
    title: el.getAttribute('title'),
    // For form elements
    name: (el as HTMLInputElement).name,
    placeholder: (el as HTMLInputElement).placeholder,
    // For links
    href: (el as HTMLAnchorElement).href,
  };
}, el);
```

### Phase 2: Support ARIA Selectors in `click`/`type`

Add selector parser that understands:
- `button[name='Submit']`
- `[role='button'][aria-label='Close']`
- `[aria-label~='Search']` (partial match)

Could use existing accessibility tree APIs or custom query logic.

### Phase 3: Update `inspect` Help/Examples

```bash
browser inspect --help

# Examples:
# Return elements with ARIA info
browser inspect --aria --tab abc123

# Find element by ARIA role
browser inspect --role button --tab abc123
```

---

## Benefits

| Benefit | Impact |
|---------|--------|
| **Stability** | Selectors survive CSS/ID changes |
| **Accessibility** | Works with screen reader semantics |
| **Agent-friendly** | Natural language-like queries |
| **SPA-safe** | Persists across React re-renders |

---

## Tradeoffs

| Tradeoff | Mitigation |
|----------|------------|
| Larger output | Make ARIA optional (`--aria` flag) |
| Not all elements have ARIA | Fall back to CSS selectors |
| Query parsing complexity | Start simple, iterate |

---

## References

1. **webctl GitHub:** https://github.com/cosinusalpha/webctl
2. **HN Thread:** https://news.ycombinator.com/item?id=46616481
3. **ARIA Spec:** https://www.w3.org/TR/wai-aria-1.2/
4. **Chrome Accessibility API:** https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/
5. **Puppeteer Accessibility:** https://pptr.dev/api/puppeteer.accessibility

---

## Notes from OpenClaw Research

OpenClaw's Browser Relay extension doesn't specifically mention ARIA, but they do mention:
- "Can extract some page structure when possible"
- Screenshot-based "eyes" for the agent
- Tab-group gating for security

**Key difference:** OpenClaw focuses on reliability (reconnection, state persistence), while webctl focuses on **selector stability** via ARIA.

Both approaches are complementary and worth investigating.
