#!/usr/bin/env node
"use strict";
/**
 * Browser CLI - Main entry point
 *
 * Agent-optimized browser automation via Puppeteer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const session_1 = require("./session");
const timeout_1 = require("./utils/timeout");
const go_1 = require("./commands/go");
const click_1 = require("./commands/click");
const type_1 = require("./commands/type");
const screenshot_1 = require("./commands/screenshot");
const eval_1 = require("./commands/eval");
const inspect_1 = require("./commands/inspect");
const scroll_1 = require("./commands/scroll");
const find_1 = require("./commands/find");
const program = new commander_1.Command();
const wait_for_1 = require("./commands/wait-for");
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
    .option('--host <host>', 'Connect to Chrome on remote host (defaults to localhost)', 'localhost')
    .option('--ws <url>', 'Connect via WebSocket URL')
    .option('--timeout <ms>', 'Operation timeout in milliseconds', process.env.BROWSER_TIMEOUT || '30000');
// go command
program
    .command('go <url>')
    .description('Navigate to URL (creates new tab, or use --tab to navigate existing)')
    .option('--wait-load-state <state>', 'Wait state', 'domcontentloaded')
    .option('--tab <id>', 'Navigate existing tab')
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (url, options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await (0, go_1.go)(session.page, url, { ...options, timeout });
        }
        finally {
            await session.close();
        }
    }
    catch (error) {
        console.error(`[go] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
    }
});
// click command
program
    .command('click <selector>')
    .description('Click element (optionally navigate first with --url, or use --tab for existing tab)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--wait <ms>', 'Wait after click', '0')
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (selector, options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await (0, click_1.click)(session.page, selector, { ...options, timeout });
        }
        finally {
            await session.close();
        }
    }
    catch (error) {
        console.error(`[click] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
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
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (selector, text, options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await (0, type_1.type)(session.page, selector, text, { ...options, timeout });
        }
        finally {
            await session.close();
        }
    }
    catch (error) {
        console.error(`[type] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
    }
});
// screenshot command
program
    .command('screenshot <path>')
    .description('Capture screenshot (optionally navigate first with --url, or use --tab for existing tab)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--element <selector>', 'Capture specific element by CSS selector')
    .option('--offset <px>', 'Padding around element in pixels', '0')
    .option('--full-page', 'Full page', false)
    .option('--type <type>', 'Image type', 'png')
    .option('--quality <number>', 'JPEG quality', '80')
    .option('--no-scroll', 'Do not scroll element into view (implied when --element is used)', false)
    .option('--visible', 'Only capture if element is visible', true)
    .option('--wait <ms>', 'Wait after scroll before capture', '0')
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (path, options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await (0, screenshot_1.screenshot)(session.page, path, { ...options, timeout });
        }
        finally {
            await session.close();
        }
    }
    catch (error) {
        console.error(`[screenshot] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
    }
});
// eval command
program
    .command('eval <code>')
    .description('Execute JavaScript (optionally navigate first with --url, or use --tab for existing tab)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--json', 'Return as JSON', false)
    .option('--silent', 'Suppress output', false)
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (code, options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await (0, eval_1.evalJs)(session.page, code, { ...options, timeout });
        }
        finally {
            await session.close();
        }
    }
    catch (error) {
        console.error(`[eval] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
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
    .option('--aria', 'Include ARIA attributes in output', false)
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (selector, options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await (0, inspect_1.inspect)(session.page, selector, { ...options, aria: options.aria, timeout });
        }
        finally {
            await session.close();
        }
        process.exit(0);
    }
    catch (error) {
        console.error(`[inspect] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
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
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (direction, options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await (0, scroll_1.scroll)(session.page, { ...options, timeout });
        }
        finally {
            await session.close();
        }
    }
    catch (error) {
        console.error(`[scroll] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
    }
});
// find command
program
    .command('find <text>')
    .description('Find elements by text content')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--tag <tag>', 'Filter by tag name (e.g., button, a)')
    .option('--role <role>', 'Filter by ARIA role (e.g., button, link, checkbox)')
    .option('--aria-label <text>', 'Filter by aria-label attribute')
    .option('--exact', 'Exact text match', false)
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (text, options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await (0, find_1.find)(session.page, text, { ...options, role: options.role, ariaLabel: options.ariaLabel, timeout });
        }
        finally {
            await session.close();
        }
        process.exit(0);
    }
    catch (error) {
        console.error(`[find] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
    }
});
// wait-for command
program
    .command('wait-for <selector>')
    .description('Wait for an element to appear')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--visible', 'Wait for visible element', true)
    .option('--hidden', 'Wait for element to be hidden', false)
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (selector, options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await (0, wait_for_1.waitFor)(session.page, selector, {
                url: options.url,
                visible: options.visible,
                hidden: options.hidden,
                timeout: timeout,
            });
        }
        finally {
            await session.close();
        }
        process.exit(0);
    }
    catch (error) {
        console.error(`[wait-for] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
    }
});
// back command
program
    .command('back')
    .description('Go back in browser history')
    .option('--tab <id>', 'Target specific tab')
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await session.page.goBack({ timeout });
        }
        finally {
            await session.close();
        }
    }
    catch (error) {
        console.error(`[back] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
    }
});
// forward command
program
    .command('forward')
    .description('Go forward in browser history')
    .option('--tab <id>', 'Target specific tab')
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '', 10);
    const timeout = options.timeout ? parseInt(options.timeout) : parseInt(opts.timeout || '30000');
    try {
        const session = await (0, timeout_1.withTimeout)((0, session_1.createSession)({
            headless: opts.headless,
            slowMo: parseInt(opts.slowMo),
            port: port || undefined,
            ws: opts.ws,
            tabId: options.tab,
        }), timeout, 'Session creation');
        try {
            await session.page.goForward({ timeout });
        }
        finally {
            await session.close();
        }
    }
    catch (error) {
        console.error(`[forward] Failed: ${error.message}`);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(2);
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
    const host = opts.host || 'localhost';
    if (!port) {
        console.log(JSON.stringify({
            success: false,
            error: '--port or BROWSER_PORT required',
        }));
        process.exit(1);
    }
    try {
        const response = await fetch(`http://${host}:${port}/json`);
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
    const host = opts.host || 'localhost';
    if (!port) {
        console.log(JSON.stringify({
            success: false,
            error: '--port or BROWSER_PORT required',
        }));
        process.exit(1);
    }
    try {
        await fetch(`http://${host}:${port}/json/close/${options.tab}`);
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