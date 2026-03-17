"use strict";
/**
 * Session Manager - Browser session lifecycle management
 *
 * Handles browser launch, connection, and tab attachment.
 * Uses Puppeteer for native Chrome DevTools Protocol support.
 *
 * Usage:
 *   // Launch new browser
 *   const session = await createSession({ headless: false });
 *
 *   // Connect to existing Chrome
 *   const session = await createSession({ port: 9222 });
 *
 *   // Attach to specific existing tab
 *   const session = await createSession({ port: 9222, tabId: 'abc123' });
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
/**
 * Create a new browser session
 */
async function createSession(options = {}) {
    const port = options.port || parseInt(process.env.BROWSER_PORT || '', 10);
    const ws = options.ws || process.env.BROWSER_WS;
    const tabId = options.tabId;
    // Validate: tabId requires port or ws
    if (tabId && !port && !ws) {
        throw new Error('tabId requires --port or --ws (or set BROWSER_PORT/BROWSER_WS)');
    }
    let browser;
    let page;
    let connected = false;
    let actualTabId;
    // Case 1: Attach to specific existing tab
    if (tabId && port) {
        console.error(`[session] Attaching to existing tab: ${tabId}`);
        // First verify tab exists
        const tabsResponse = await fetch(`http://localhost:${port}/json`);
        const tabs = await tabsResponse.json();
        const tabInfo = tabs.find(t => t.id === tabId);
        if (!tabInfo) {
            throw new Error(`Tab ${tabId} not found. Run 'browser tabs --port ${port}' to list tabs.`);
        }
        // Connect to the browser (not specific tab)
        browser = await puppeteer_core_1.default.connect({
            browserURL: `http://localhost:${port}`,
        });
        // Get all pages and find the one with matching tab ID
        const pages = await browser.pages();
        // Find page by matching target ID
        let foundPage;
        for (const p of pages) {
            try {
                const client = await p.target().createCDPSession();
                const { targetInfo } = await client.send('Target.getTargetInfo');
                await client.detach();
                if (targetInfo.targetId === tabId) {
                    foundPage = p;
                    break;
                }
            }
            catch {
                // Skip pages we can't get target info from
            }
        }
        if (!foundPage) {
            throw new Error(`Tab ${tabId} not found. Run 'browser tabs --port ${port}' to list tabs.`);
        }
        page = foundPage;
        connected = true;
        actualTabId = tabId;
        const close = async () => {
            console.error('[session] Detaching from tab (tab stays open in Chrome)');
            await browser.disconnect().catch(() => { });
        };
        console.error(`[session] Attached to tab ${tabId}`);
        return { browser, page, tabId: actualTabId, options, close };
    }
    // Case 2: Connect to existing Chrome (will create new tab)
    if (ws || port) {
        const connectUrl = ws || `http://localhost:${port}`;
        console.error(`[session] Connecting to Chrome: ${connectUrl}`);
        browser = await puppeteer_core_1.default.connect({
            browserURL: ws ? undefined : connectUrl,
            browserWSEndpoint: ws,
        });
        // Create new page (new tab)
        page = await browser.newPage();
        connected = true;
        const close = async () => {
            console.error('[session] Detaching from Chrome (tab stays open)');
            await browser.disconnect().catch(() => { });
        };
        console.error('[session] Connected to Chrome, created new tab');
        return { browser, page, options, close };
    }
    // Case 3: Launch new browser
    const headless = options.headless ?? false;
    const slowMo = options.slowMo ?? 0;
    console.error(`[session] Launching Chrome (headless: ${headless})`);
    browser = await puppeteer_core_1.default.launch({
        headless,
        slowMo,
        args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-sandbox',
        ],
    });
    page = await browser.newPage();
    const close = async () => {
        console.error('[session] Closing browser');
        await browser.close().catch(() => { });
    };
    console.error('[session] Browser launched');
    return { browser, page, options, close };
}
//# sourceMappingURL=session.js.map