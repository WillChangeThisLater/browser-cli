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
const cli_1 = require("./utils/cli");
const go_1 = require("./commands/go");
const click_1 = require("./commands/click");
const aim_1 = require("./commands/aim");
const type_1 = require("./commands/type");
const screenshot_1 = require("./commands/screenshot");
const eval_1 = require("./commands/eval");
const inspect_1 = require("./commands/inspect");
const scroll_1 = require("./commands/scroll");
const find_1 = require("./commands/find");
const program = new commander_1.Command();
(0, cli_1.installProcessHandlers)();
/**
 * Single failure exit path for command actions. Runs after the action's
 * `finally { session.close() }`, so cleanup has already happened.
 * CliError payloads (from command implementations) are preserved verbatim.
 */
function commandError(cmd, error) {
    const message = error instanceof Error ? error.message : String(error);
    const log = `[${cmd}] Failed: ${message}`;
    if (error instanceof cli_1.CliError)
        (0, cli_1.fail)(error.exitCode, error.payload, log);
    (0, cli_1.fail)(2, { error: message }, log);
}
const wait_for_1 = require("./commands/wait-for");
// Usage failures must also honor the JSON contract (see utils/cli.ts). NOTE:
// exitOverride must be installed BEFORE commands are registered — children copy
// settings at registration time, so a late override leaves them calling
// process.exit directly. Help and version pass through untouched: commander
// writes their output itself before invoking the override, and exitCode 0
// means "not a failure".
program.exitOverride();
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
        commandError('go', error);
    }
});
// click command
program
    .command('click <selector>')
    .description('Click element (optionally navigate first with --url, or use --tab for existing tab)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--wait <ms>', 'Wait after click', '0')
    .option('--exact', 'Exact match for text:/aria: targets (default: substring)', false)
    .option('--verify <js>', 'JS expression evaluated after the click; result returned as `verify`')
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
        commandError('click', error);
    }
});
// aim command
program
    .command('aim <target> <path>')
    .description('Visualize where a click would land: inject a crosshair at the resolved target and screenshot (no click)')
    .option('--url <url>', 'Navigate first')
    .option('--tab <id>', 'Target specific tab')
    .option('--exact', 'Exact match for text:/aria: targets (default: substring)', false)
    .option('--full-page', 'Capture full page instead of viewport', false)
    .option('--type <type>', 'Image type', 'png')
    .option('--quality <number>', 'JPEG quality', '80')
    .option('--timeout <ms>', 'Operation timeout', undefined)
    .action(async (target, path, options) => {
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
            await (0, aim_1.aim)(session.page, target, path, { ...options, timeout });
        }
        finally {
            await session.close();
        }
    }
    catch (error) {
        commandError('aim', error);
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
        commandError('type', error);
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
        commandError('screenshot', error);
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
        commandError('eval', error);
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
        commandError('inspect', error);
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
        commandError('scroll', error);
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
        commandError('find', error);
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
        commandError('wait-for', error);
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
        commandError('back', error);
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
        commandError('forward', error);
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
  {"success":true,"tabs":[{"id":"...","title":"...","url":"...","type":"page","created":1234567890},...]}
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
            created: tab.created, // Chrome JSON API provides this field (epoch timestamp)
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
    .description('Close a tab (or all tabs with --all) in a Chrome instance')
    .option('--tab <id>', 'Tab ID to close')
    .option('--all', 'Close all page tabs (agents: use for cleaning up tabs YOU opened)')
    .addHelpText('after', `
Examples:
  browser close --tab abc123 --port 9222            # Close specific tab
  browser close --all --port 9222                   # Close every page tab

Output:
  {"success":true,"tabId":"abc123","action":"closed"}
  {"success":false,"error":"Tab abc123 not found. Run 'browser tabs' to list tabs."}
`)
    .action(async (options) => {
    const opts = program.opts();
    const port = opts.port ? parseInt(opts.port) : parseInt(process.env.BROWSER_PORT || '0');
    const host = opts.host || 'localhost';
    if (!port) {
        (0, cli_1.fail)(1, { error: '--port or BROWSER_PORT required' });
    }
    if (!options.tab && !options.all) {
        (0, cli_1.fail)(1, { error: "missing required option --tab <id> (or --all)", usage: 'browser close --tab <id> [--port N] | browser close --all [--port N]' });
    }
    try {
        // Verify against the real tab list: /json/close always answers 200, so a
        // wrong tab id must be caught here, not reported as success.
        const tabsResponse = await fetch(`http://${host}:${port}/json`);
        const tabs = (await tabsResponse.json());
        const pageTabs = tabs.filter((t) => t.type === 'page');
        if (options.all) {
            for (const tab of pageTabs) {
                await fetch(`http://${host}:${port}/json/close/${tab.id}`);
            }
            console.log(JSON.stringify({ success: true, action: 'closed-all', closed: pageTabs.length }));
            process.exit(0);
        }
        const matches = pageTabs.filter((t) => t.id === options.tab || t.id.startsWith(options.tab));
        if (matches.length === 0) {
            (0, cli_1.fail)(2, { error: `Tab ${options.tab} not found. Run 'browser tabs --port ${port}' to list tabs.`, tabId: options.tab });
        }
        if (matches.length > 1) {
            (0, cli_1.fail)(2, {
                error: `Tab id prefix '${options.tab}' is ambiguous — ${matches.length} tabs match. Use a longer prefix.`,
                matches: matches.map((t) => ({ id: t.id, title: t.title, url: t.url })),
            });
        }
        const target = matches[0];
        if (target.id !== options.tab) {
            console.error(`[close] Tab id prefix '${options.tab}' resolved to ${target.id}`);
        }
        await fetch(`http://${host}:${port}/json/close/${target.id}`);
        console.log(JSON.stringify({
            success: true,
            tabId: target.id,
            action: 'closed',
        }));
        process.exit(0);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        (0, cli_1.fail)(2, { error: msg });
    }
});
// Help and version pass through untouched: commander writes their output itself
// before invoking the override, and exitCode 0 means "not a failure".
try {
    program.parse();
}
catch (error) {
    if (error instanceof commander_1.CommanderError) {
        if (error.exitCode === 0)
            process.exit(0);
        (0, cli_1.fail)(1, { error: error.message, usage: `browser ${process.argv[2] ?? ''} --help` });
    }
    throw error;
}
//# sourceMappingURL=index.js.map