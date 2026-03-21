# browser-cli

A lightweight CLI for browser automation via Puppeteer. Connects to an existing Chrome/Chromium instance on port 9222 and provides predefined commands for safe, agent-friendly browser interactions like navigation, form filling, screenshots, and JavaScript evaluation.

**Important:** This tool connects to an EXISTING browser instance. It does NOT launch browsers itself.

## Installation

```bash
# Build the project
cd /home/paul/repos/browser-cli
npm run build

# Copy to global location
cp -r dist /home/paul/.nvm/versions/node/$(node -v | cut -d. -f1,2,3)/lib/node_modules/browser-cli
cp -r node_modules /home/paul/.nvm/versions/node/$(node -v | cut -d. -f1,2,3)/lib/node_modules/browser-cli

# Create package.json with bin entry
cat > /home/paul/.nvm/versions/node/$(node -v | cut -d. -f1,2,3)/lib/node_modules/browser-cli/package.json << 'EOF'
{
  "name": "browser-cli",
  "version": "0.1.0",
  "bin": {
    "browser": "./dist/index.js"
  }
}
EOF

# Create bin symlink
mkdir -p /home/paul/.nvm/versions/node/$(node -v | cut -d. -f1,2,3)/lib/node_modules/.bin
ln -sf /home/paul/.nvm/versions/node/$(node -v | cut -d. -f1,2,3)/lib/node_modules/browser-cli/dist/index.js /home/paul/.nvm/versions/node/$(node -v | cut -d. -f1,2,3)/lib/node_modules/.bin/browser

# Make executable
chmod +x /home/paul/.nvm/versions/node/$(node -v | cut -d. -f1,2,3)/lib/node_modules/browser-cli/dist/index.js
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

# Take a screenshot
browser screenshot output.png --tab <tab-id>
```

## Documentation

- **Agent Guidelines:** [`AGENTS.md`](AGENTS.md) - Sane defaults and best practices
- **Site Controls:** [`docs/controls/README.md`](docs/controls/README.md) - Site-specific patterns
