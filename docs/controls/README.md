# Browser CLI Controls Documentation

This directory contains site-specific automation guides for the browser CLI tool.

## Structure

```
docs/controls/
├── README.md                    # This file - general patterns
├── duckduckgo.com/
│   └── controls.md              # DuckDuckGo-specific patterns
├── pokemonshowdown.com/
│   └── pokemonshowdown.com.md   # Pokemon Showdown patterns
└── <domain>/
    └── controls.md              # New site documentation
```

## When to Write Documentation

Write a `controls.md` file whenever you:
- Discover a reliable workflow for a new site
- Find a useful command pattern
- Solve a tricky interaction problem
- Need to document work for future agents

**Why this matters:** Future agents won't need to rediscover the same patterns, saving time and reducing duplication.

## File Naming

Use the domain name: `controls.md` inside `docs/controls/<domain>/`

**Examples:**
- `docs/controls/duckduckgo.com/controls.md`
- `docs/controls/github.com/controls.md`
- `docs/controls/npmjs.com/controls.md`

## Documentation Content

Each file should cover:

1. **Quick start** - Basic navigation examples
2. **Key selectors** - Important HTML elements
3. **Common patterns** - Search, click, form interactions
4. **Known issues** - Edge cases and workarounds

## Maintenance

**Update documentation when:**

- Selectors change (sites update frequently)
- New reliable patterns are discovered
- Workarounds for issues are found
- Documentation becomes outdated or incorrect

**Why this matters:** Sites change often. Keeping documentation current ensures future agents can work reliably without rediscovering patterns or fighting outdated selectors.

## General Patterns

### Navigation

```bash
# Direct URL navigation
browser go <url> --tab <tab-id>

# Use specific tab (reuse existing)
browser go <url> --tab <existing-tab-id>
```

### Form Interaction

```bash
# Type into input
browser type <selector> <text> --tab <tab-id>

# Type with Enter (for forms)
browser type <selector> <text> --enter --tab <tab-id>

# Click element
browser click <selector> --tab <tab-id>
```

### JavaScript Evaluation

```bash
# Get page state
browser eval <code> --tab <tab-id> --json

# Click link via JS
browser eval "(async () => { const link = document.querySelector('a'); if (link) link.click(); })" --tab <tab-id>
```

### Screenshots

```bash
# Standard screenshot
browser screenshot <path> --tab <tab-id>

# Full page
browser screenshot <path> --full-page --tab <tab-id>
```

## Best Practices

1. **Always specify `--tab <tab-id>`** when possible
2. **Use `--json` flag** for programmatic result parsing
3. **Include timeout** for reliability: `--timeout 30000`
4. **Document selectors** in a table format
5. **Note known issues** and workarounds

## Tools

### Check Available Tabs

```bash
browser tabs --port 9222
```

### List All Files

```bash
ls -la docs/controls/
```

### Search for Patterns

```bash
grep -r "browser type" docs/controls/
```
