#!/usr/bin/env node
"use strict";
/**
 * Browser CLI - Main entry point
 *
 * Agent-optimized browser automation via Puppeteer.
 *
 * Usage:
 *   browser go <url>                          # Navigate (creates new tab)
 *   browser click <sel> --url <url>           # Click (optionally navigate first)
 *   browser click <sel> --tab <id>            # Click on specific existing tab
 *   browser tabs --port 9222                  # List all tabs
 *   browser close --tab <id>                  # Close specific tab
 */
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const session_1 = require("./session");
const go_1 = require("./commands/go");
const click_1 = require("./commands/click");
const type_1 = require("./commands/type");
const screenshot_1 = require("./commands/screenshot");
const eval_1 = require("./commands/eval");
const inspect_1 = require("./commands/inspect");
const scroll_1 = require("./commands/scroll");
const program = new commander_1.Command();
program
    .name('browser')
    .description('Agent-optimized browser automation CLI')
    .version('0.1.0');
// Global options
program
    .option('--browser <type>', 'Browser type (chromium only for now)', 'chromium')
    .option('--headless', 'Run in headless mode', false)
    .option('--slow-mo <ms>', 'Slow down actions', '0')
    .option('--port <number>', 'Connect to Chrome on port')
    .option('--ws <url>', 'Connect via WebSocket URL');
// go command
program
    .command('go <url>')
    .description('Navigate to URL (creates new tab, or use --tab to navigate existing)')
    .option('--wait-load-state <state>', 'Wait state', 'domcontentloaded')
    .option('--tab <id>', 'Navigate existing tab')
    .addHelpText('after', `
Examples:
  browser go https://example.com                    # Navigate in new tab
  browser go https://example.com --tab abc123       # Navigate existing tab
  browser go https://example.com --port 9222        # Connect to Chrome, new tab

Output:
  {"success":true,"tabId":"...","url":"...","title":"...","finalUrl":"..."}
`)
    .action(async (url, options) => {
    const opts = program.opts();
    const session = await (0, session_1.createSession)({
        headless: opts.headless,
        slowMo: parseInt(opts.slowMo),
        port: opts.port ? parseInt(opts.port) : undefined,
        ws: opts.ws,
        tabId: options.tab,
    });
    try {
        await (0, go_1.go)(session.page, url, options);
    }
    finally {
        await session.close();
        process.exit(0);
    }
});
// click command
program
    .command('click <selector>')
    .description('Click element (optionally navigate first with --url, or use --tab for existing tab)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--wait <ms>', 'Wait after click', '0')
    .addHelpText('after', `
Examples:
  browser click "#login"                            # Click on current tab
  browser click "#login" --url example.com          # Navigate then click
  browser click "#login" --tab abc123               # Click on existing tab
  browser click "#submit" --wait 2000               # Wait 2s after click

Output:
  {"success":true,"tabId":"...","selector":"...","url":"...","title":"..."}
`)
    .action(async (selector, options) => {
    const opts = program.opts();
    const session = await (0, session_1.createSession)({
        headless: opts.headless,
        slowMo: parseInt(opts.slowMo),
        port: opts.port ? parseInt(opts.port) : undefined,
        ws: opts.ws,
        tabId: options.tab,
    });
    try {
        await (0, click_1.click)(session.page, selector, options);
    }
    finally {
        await session.close();
        process.exit(0);
    }
});
// type command
program
    .command('type <selector> <text>')
    .description('Type text into input (optionally navigate first with --url, or use --tab for existing tab)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--clear', 'Clear input first', false)
    .option('--wait <ms>', 'Wait after typing', '0')
    .option('--enter', 'Press Enter after typing (for form submission)', false)
    .addHelpText('after', `
Examples:
  browser type "#email" "user@example.com"          # Type into input
  browser type "#email" "user@example.com" --clear  # Clear input first
  browser type "#q" "search" --url google.com       # Navigate then type
  browser type "#q" "search" --enter                # Type and submit (Enter)
  browser type "#msg" "hello" --tab abc123 --wait 500

Output:
  {"success":true,"tabId":"...","selector":"...","text":"...","actualValue":"...","url":"...","title":"..."}
`)
    .action(async (selector, text, options) => {
    const opts = program.opts();
    const session = await (0, session_1.createSession)({
        headless: opts.headless,
        slowMo: parseInt(opts.slowMo),
        port: opts.port ? parseInt(opts.port) : undefined,
        ws: opts.ws,
        tabId: options.tab,
    });
    try {
        await (0, type_1.type)(session.page, selector, text, {
            url: options.url,
            clear: options.clear,
            wait: parseInt(options.wait),
            enter: options.enter,
        });
    }
    finally {
        await session.close();
        process.exit(0);
    }
});
// screenshot command
program
    .command('screenshot <path>')
    .description('Capture screenshot (optionally navigate first with --url, or use --tab for existing tab)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--full-page', 'Full page', false)
    .option('--type <type>', 'Image type', 'png')
    .option('--quality <number>', 'JPEG quality', '80')
    .addHelpText('after', `
Examples:
  browser screenshot page.png                       # Screenshot current tab
  browser screenshot page.png --url example.com     # Navigate then screenshot
  browser screenshot page.png --tab abc123          # Screenshot existing tab
  browser screenshot full.png --full-page           # Full page screenshot
  browser screenshot page.jpg --type jpeg --quality 90

Output:
  {"success":true,"tabId":"...","path":"...","size":12345,"sizeKB":"12.05","fullPage":false,"type":"png","url":"...","title":"..."}
`)
    .action(async (path, options) => {
    const opts = program.opts();
    const session = await (0, session_1.createSession)({
        headless: opts.headless,
        slowMo: parseInt(opts.slowMo),
        port: opts.port ? parseInt(opts.port) : undefined,
        ws: opts.ws,
        tabId: options.tab,
    });
    try {
        await (0, screenshot_1.screenshot)(session.page, path, options);
    }
    finally {
        await session.close();
        process.exit(0);
    }
});
// eval command
program
    .command('eval <code>')
    .description('Execute JavaScript (optionally navigate first with --url, or use --tab for existing tab)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--json', 'Return as JSON', false)
    .addHelpText('after', `
Examples:
  browser eval "document.title"                     # Get page title
  browser eval "document.querySelector('#price').innerText" --tab abc123
  browser eval "JSON.stringify({x: window.innerWidth})" --json
  browser eval "fetch('/api/data').then(r=>r.json())" --url example.com

Output:
  {"success":true,"tabId":"...","result":"...","url":"...","title":"..."}
`)
    .action(async (code, options) => {
    const opts = program.opts();
    const session = await (0, session_1.createSession)({
        headless: opts.headless,
        slowMo: parseInt(opts.slowMo),
        port: opts.port ? parseInt(opts.port) : undefined,
        ws: opts.ws,
        tabId: options.tab,
    });
    try {
        await (0, eval_1.evalJs)(session.page, code, options);
    }
    finally {
        await session.close();
        process.exit(0);
    }
});
// inspect command
program
    .command('inspect [selector]')
    .description('Inspect page elements (default: interactive only, --all: full DOM)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--all', 'Return full DOM tree (default: interactive elements only)')
    .option('--depth <number>', 'Max DOM depth for --all mode', '5')
    .addHelpText('after', `
Examples:
  browser inspect                                   # List interactive elements
  browser inspect --all                             # Full DOM tree
  browser inspect "#login-btn"                      # Inspect specific element
  browser inspect --url example.com                 # Navigate then inspect

Output (interactive mode):
  {"success":true,"tabId":"...","url":"...","title":"...","mode":"interactive","elements":[{"selector":"#btn","tag":"button","text":"Submit","bounds":{...}},...]}

Output (selector mode):
  {"success":true,"tabId":"...","url":"...","title":"...","mode":"selector","elements":{"selector":"#btn","tag":"button","attributes":{...}}}
`)
    .action(async (selector, options) => {
    const opts = program.opts();
    const session = await (0, session_1.createSession)({
        headless: opts.headless,
        slowMo: parseInt(opts.slowMo),
        port: opts.port ? parseInt(opts.port) : undefined,
        ws: opts.ws,
        tabId: options.tab,
    });
    try {
        await (0, inspect_1.inspect)(session.page, selector, {
            url: options.url,
            all: options.all,
            depth: parseInt(options.depth),
        });
    }
    finally {
        await session.close();
        process.exit(0);
    }
});
// scroll command
program
    .command('scroll [direction]')
    .description('Scroll viewport (default: down, or: up, by, to)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--y <number>', 'Scroll by vertical pixels')
    .option('--x <number>', 'Scroll by horizontal pixels', '0')
    .option('--selector <sel>', 'Scroll to element')
    .addHelpText('after', `
Examples:
  browser scroll                                    # Scroll down one page
  browser scroll up                                 # Scroll up one page
  browser scroll down --tab abc123                  # Scroll down on tab
  browser scroll by --y 500 --tab abc123            # Scroll by 500px
  browser scroll to --selector "#comments"          # Scroll to element

Output:
  {"success":true,"tabId":"...","url":"...","title":"...","scrollPosition":{"x":0,"y":1234}}
`)
    .action(async (direction, options) => {
    const opts = program.opts();
    const session = await (0, session_1.createSession)({
        headless: opts.headless,
        slowMo: parseInt(opts.slowMo),
        port: opts.port ? parseInt(opts.port) : undefined,
        ws: opts.ws,
        tabId: options.tab,
    });
    try {
        await (0, scroll_1.scroll)(session.page, {
            url: options.url,
            direction: direction,
            y: options.y ? parseInt(options.y) : undefined,
            x: options.x ? parseInt(options.x) : undefined,
            selector: options.selector,
        });
    }
    finally {
        await session.close();
        process.exit(0);
    }
});
// tabs command
program
    .command('tabs')
    .description('List all open tabs in a Chrome instance')
    .addHelpText('after', `
Examples:
  browser tabs --port 9222                          # List tabs on port 9222
  BROWSER_PORT=9222 browser tabs                    # Use env variable

Output:
  {"success":true,"tabs":[{"id":"...","title":"...","url":"...","type":"page"},...]}
`)
    .action(async () => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '0');
    if (!port) {
        console.log(JSON.stringify({
            success: false,
            error: '--port or BROWSER_PORT required',
        }));
        process.exit(1);
    }
    try {
        const response = await fetch(`http://localhost:${port}/json`);
        const tabs = await response.json();
        const result = tabs
            .filter(t => t.type === 'page')
            .map(tab => ({
            id: tab.id,
            title: tab.title,
            url: tab.url,
            type: tab.type,
        }));
        console.log(JSON.stringify({
            success: true,
            tabs: result,
        }));
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(JSON.stringify({
            success: false,
            error: msg,
        }));
        process.exit(1);
    }
});
// close command
program
    .command('close')
    .description('Close a tab in a Chrome instance')
    .requiredOption('--tab <id>', 'Tab ID to close')
    .addHelpText('after', `
Examples:
  browser close --tab abc123 --port 9222            # Close specific tab

Output:
  {"success":true,"tabId":"abc123","action":"closed"}
`)
    .action(async (options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '0');
    if (!port) {
        console.log(JSON.stringify({
            success: false,
            error: '--port or BROWSER_PORT required',
        }));
        process.exit(1);
    }
    try {
        await fetch(`http://localhost:${port}/json/close/${options.tab}`);
        console.log(JSON.stringify({
            success: true,
            tabId: options.tab,
            action: 'closed',
        }));
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(JSON.stringify({
            success: false,
            error: msg,
        }));
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map