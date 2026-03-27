# Browser CLI Design Document

## Overview

A lightweight CLI for browser automation via Chrome DevTools Protocol (CDP). The CLI wraps Playwright to provide safe, predefined commands while exposing optional raw CDP access for advanced use cases.

**Target Agent:** Claude Code or equivalent
**Language:** TypeScript
**Browser:** Chrome/Chromium (primary), Firefox (optional)

## Features

### Positional Tab IDs

Tabs can be referenced by both UUID (stable across sessions) and positional IDs (ephemeral, for convenience):

- **UUID format**: `9B7D037E0605DAE6A13BFCC1297D33F3` - Stable, unique identifier
- **Positional format**: `tab_0`, `tab_1`, `tab_2`, etc. - Position-based, changes when tabs are added/removed

**Usage examples:**
```bash
# View tabs with both IDs
browser tabs --port 9222

# Navigate using positional ID
browser go https://news.ycombinator.com --tab tab_1

# Navigate using UUID (more stable)
browser go https://news.ycombinator.com --tab 9B7D037E0605DAE6A13BFCC1297D33F3
```

**Important:** Positional IDs are ephemeral. When a tab is added or removed, the positions shift. Use UUIDs for long-lived workflows.

---

---

## CLI Interface

### Commands

#### 1. `go` - Navigate to URL
```bash
browser go <url> [options]

Options:
  --browser <chromium|firefox>
  --headless
  --new-tab
  --wait-load-state <domcontentloaded|networkidle0|networkidle2>
```

#### 2. `click` - Click element by selector
```bash
browser click <selector> [options]

Options:
  --wait <ms>
  --force
```

#### 3. `type` - Type text into input by selector
```bash
browser type <selector> <text> [options]

Options:
  --wait <ms>
  --clear
```

#### 4. `screenshot` - Capture viewport
```bash
browser screenshot <output-path> [options]

Options:
  --full-page
  --omit-background
  --quality <0-100>
```

#### 5. `eval` - Execute JavaScript in page context
```bash
browser eval <js-code> [options]

Options:
  --json  # Return JSON instead of string
  --silent  # Suppress output
```

#### 6. `wait` - Wait for duration
```bash
browser wait <milliseconds>
```

#### 7. `inspect` - Print DOM tree
```bash
browser inspect [selector] [options]

Options:
  --depth <number>
  --format <html|json|text>
```

#### 8. `network` - List captured network requests
```bash
browser network [options]

Options:
  --filter <regex>
  --format <json|table>
```

#### 9. `connect` - Connect to existing Chrome session
```bash
browser connect [options]

Options:
  --auto  # Auto-discover on localhost:9222-9229
  --port <number>
  --ws <ws://host:port>
  --user-data-dir <path>
```

#### 10. `disconnect` - Close browser session
```bash
browser disconnect [options]

Options:
  --confirm
```

#### 11. `help` - Show CLI help
```bash
browser help [command]
```

### Special Commands

#### `browser cdp` - Raw CDP message (expert only)
```bash
browser cdp <json-protocol-message>

Example:
browser cdp '{"method": "Network.enable", "params": {}}'
```

#### `browser script` - Load external automation script
```bash
browser script <script-file> [options]

Options:
  --connect <ws://host:port>
```

---

## Architecture

### Directory Structure
```
browser-cli/
├── src/
│   ├── index.ts          # CLI entry point (commander.js)
│   ├── session.ts        # Browser session management
│   ├── commands/
│   │   ├── go.ts
│   │   ├── click.ts
│   │   ├── type.ts
│   │   ├── screenshot.ts
│   │   ├── eval.ts
│   │   ├── wait.ts
│   │   ├── inspect.ts
│   │   ├── network.ts
│   │   ├── connect.ts
│   │   ├── disconnect.ts
│   │   ├── cdp.ts
│   │   └── script.ts
│   └── utils/
│       ├── cdp-client.ts
│       └── selectors.ts
├── docs/                   # Research, design notes, specs
│   ├── README.md
│   ├── openclaw-research-findings.md
│   └── future-improvements-aria-selectors.md
├── experiments/            # Test runs and session logs
│   ├── README.md
│   └── ...
├── package.json
├── tsconfig.json
├── playwright.config.ts
└── DESIGN.md
```

### Core Components

#### 1. Session Manager (`session.ts`)
- Handles browser lifecycle (launch, connect, disconnect)
- Manages Chrome user-data-dir for isolated profiles
- Auto-discovers existing sessions on port 9222-9229

#### 2. CDP Client (`cdp-client.ts`)
- Wrapper around Playwright's CDP connection
- Provides both high-level (Playwright) and low-level (raw CDP) access
- Handles error translation from CDP to CLI

#### 3. Command Handlers (`commands/*.ts`)
- Each command is a separate module
- Accepts CLI arguments via commander.js
- Returns structured output to CLI

#### 4. Utilities (`utils/*.ts`)
- Selector helpers (wait for element, click, type)
- CDP protocol helpers (serialize/deserialize)
- Error handling utilities

## Implementation Order

### Phase 1: Core Infrastructure
- Setup TypeScript project
- Install Playwright + dependencies
- Implement Session Manager (launch/connect/disconnect)
- Implement CDP Client (basic connection)
- Implement `connect` and `disconnect` commands
- Implement `help` command

### Phase 2: Basic Navigation
- Implement `go` command (navigate to URL)
- Implement `wait` command
- Implement `inspect` command (basic DOM dump)
- Implement `screenshot` command (basic)

### Phase 3: Interaction Commands
- Implement `click` command (element selection, click)
- Implement `type` command (focus, type, blur)
- Implement `eval` command (JavaScript execution)
- Add wait options to click/type

### Phase 4: Advanced Features
- Implement `network` command (request capture)
- Implement `cdp` command (raw protocol access)
- Implement `script` command (external scripts)
- Add Firefox support (optional)

---

## Engineering Strategy

### Agentic Best Practices

**Clarify before coding:**
- Restate requirement before implementation
- Ask questions if anything is unclear
- Confirm before coding each phase

**Test incrementally:**
- Test each command immediately after building
- Don't wait until end to test
- Fix issues before moving on

**One command at a time:**
- Build one module, test it, then move on
- Don't build all commands at once
- Document each command's test

### Testing

**Manual testing (every command):**
- Run command manually
- Verify it works
- Document test command

**Human-in-the-loop (new commands):**
- Agent launches isolated browser
- Agent runs command, captures screenshot
- Agent asks human: "verify" / "skip" / "custom"
- Human confirms or gives feedback
- Agent adjusts if needed

### Code Quality

**Type safety:**
- Use TypeScript for all code
- Explicit types on functions
- Catch errors at compile time

**Error handling:**
- Validate inputs early
- Clear error messages with context
- Exit codes: 0=success, 1=cmd error, 2=session error, 3=invalid args

**Modular design:**
- One file per command
- Shared utilities in utils/
- No monolithic code
