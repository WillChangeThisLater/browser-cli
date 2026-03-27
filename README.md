# browser-cli

A lightweight CLI for browser automation via Puppeteer. Connects to an existing Chrome/Chromium instance on port 9222 and provides predefined commands for safe, agent-friendly browser interactions like navigation, form filling, screenshots, and JavaScript evaluation.

**Important:** This tool connects to an EXISTING browser instance. It does NOT launch browsers itself.

## Installation

### Recommended (Simple)

```bash
cd /home/paul/repos/browser-cli
npm run build
npm link
```

Then run from anywhere: `browser go https://example.com`

### Alternative: Use npx (No install needed)

```bash
npx browser go https://example.com
```

Or simply run from the repo:
```bash
node dist/index.js go https://duckduckgo.com
```

## Usage

```
Usage: browser [options] [command]

Agent-optimized browser automation CLI

Options:
  -V, --version                     output the version number
  --browser <type>                  Browser type (chromium only for now)
                                    (default: "chromium")
  --headless                        Run in headless mode (default: false)
  --slow-mo <ms>                    Slow down actions (default: "0")
  --port <number>                   Connect to Chrome on port
  --host <host>                     Connect to Chrome on remote host (defaults
                                    to localhost) (default: "localhost")
  --ws <url>                        Connect via WebSocket URL
  --timeout <ms>                    Operation timeout in milliseconds (default:
                                    "120000")
  -h, --help                        display help for command

Commands:
  go [options] <url>                Navigate to URL (creates new tab, or use
                                    --tab to navigate existing)
  click [options] <selector>        Click element (optionally navigate first
                                    with --url, or use --tab for existing
                                    tab)
  type [options] <selector> <text>  Type text into input (optionally navigate
                                    first with --url, or use --tab for existing
                                    tab)
  screenshot [options] <path>       Capture screenshot (optionally navigate
                                    first with --url, or use --tab for existing
                                    tab)
  eval [options] <code>             Execute JavaScript (optionally navigate
                                    first with --url, or use --tab for existing
                                    tab)
  inspect [options] [selector]      Inspect page elements (default: interactive
                                    only, --all: full DOM)
  scroll [options] [direction]      Scroll viewport (default: down, or: up, by,
                                    to)
  find [options] <text>             Find elements by text content
  wait-for [options] <selector>     Wait for an element to appear
  tabs                              List all open tabs in a Chrome instance
  close [options]                   Close a tab in a Chrome instance
  help [command]                    display help for command
```

## Quick Start

```bash
# Navigate to DuckDuckGo
browser go https://duckduckgo.com --tab <tab-id>

# Search for a query
browser go https://duckduckgo.com/?q=your+search+query

# Take a screenshot (viewport)
browser screenshot output.png --tab <tab-id>

# Take an element screenshot (auto-scrolls to element)
browser screenshot element.png --element "#my-button" --tab <tab-id>

# Element screenshot with padding and scroll wait
browser screenshot element.png --element ".card" --offset 20 --wait 500 --tab <tab-id>
```

## Element Screenshots

Capture specific DOM elements by CSS selector. **Scrolling is implied** (use `--no-scroll` to opt-out):

```bash
# Basic element screenshot (scrolls automatically)
browser screenshot /tmp/button.png --element "#my-button"

# With padding
browser screenshot /tmp/button.png --element "#my-button" --offset 20

# Scroll into view and wait
browser screenshot /tmp/item.png --element ".item-50" --scroll --wait 500

# Don't scroll (opt-out)
browser screenshot /tmp/check.png --element ".sidebar" --no-scroll

# Verify element is visible
browser screenshot /tmp/error.png --element ".error" --visible
```

**Options:**
- `--element <selector>` - CSS selector of element to capture
- `--offset <px>` - Padding around element (default: 0)
- `--no-scroll` - Don't scroll element into view (default: scroll when --element is used)
- `--visible` - Only capture if element is visible (default: true)
- `--wait <ms>` - Wait after scroll before capture (default: 500ms when scrolling)

## Documentation

- **Agent Guidelines:** [`AGENTS.md`](AGENTS.md) - Sane defaults and best practices
- **Site Controls:** [`docs/controls/README.md`](docs/controls/README.md) - Site-specific patterns
