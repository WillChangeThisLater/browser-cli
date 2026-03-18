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

import puppeteer, { Browser, Page, ConnectOptions } from 'puppeteer-core';

export interface SessionOptions {
  headless?: boolean;
  slowMo?: number;
  port?: number;
  ws?: string;
  tabId?: string;
}

export interface Session {
  browser: Browser;
  page: Page;
  tabId?: string;
  options: SessionOptions;
  close: () => Promise<void>;
}

/**
 * Create a new browser session
 */
export async function createSession(options: SessionOptions = {}): Promise<Session> {

  const port = options.port || parseInt(process.env.BROWSER_PORT || '', 10);
  const ws = options.ws || process.env.BROWSER_WS;
  const tabId = options.tabId;

  // Validate: tabId requires port or ws
  if (tabId && !port && !ws) {
    throw new Error('tabId requires --port or --ws (or set BROWSER_PORT/BROWSER_WS)');
  }

  let browser: Browser;
  let page: Page;
  let connected = false;
  let actualTabId: string | undefined;

  // Case 1: Attach to specific existing tab
  if (tabId && port) {
    console.error(`[session] Attaching to existing tab: ${tabId}`);
    
    // First verify tab exists
    const tabsResponse = await fetch(`http://localhost:${port}/json`);
    const tabs = await tabsResponse.json() as any[];
    const tabInfo = tabs.find(t => t.id === tabId);
    
    if (!tabInfo) {
      throw new Error(`Tab ${tabId} not found. Run 'browser tabs --port ${port}' to list tabs.`);
    }
    
    // Connect to the browser (not specific tab)
    browser = await puppeteer.connect({
      browserURL: `http://localhost:${port}`,
    });
    
    // Get all pages and find the one with matching tab ID
    const pages = await browser.pages();
    
    // Find page by matching target ID
    let foundPage: Page | undefined;
    for (const p of pages) {
      try {
        const client = await p.target().createCDPSession();
        const { targetInfo } = await client.send('Target.getTargetInfo');
        await client.detach();
        if (targetInfo.targetId === tabId) {
          foundPage = p;
          break;
        }
      } catch {
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
      await Promise.race([
        browser.disconnect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('disconnect timeout')), 5000)
        )
      ]).catch(() => {});
    };
    
    console.error(`[session] Attached to tab ${tabId}`);
    return { browser, page, tabId: actualTabId, options, close };
  }

  // Case 2: Connect to existing Chrome (will create new tab)
  if (ws || port) {
    const connectUrl = ws || `http://localhost:${port}`;
    console.error(`[session] Connecting to Chrome: ${connectUrl}`);
    
    browser = await puppeteer.connect({
      browserURL: ws ? undefined : connectUrl,
      browserWSEndpoint: ws,
    });
    
    // Create new page (new tab)
    page = await browser.newPage();
    connected = true;
    
    const close = async () => {
      console.error('[session] Detaching from Chrome (tab stays open)');
      await Promise.race([
        browser.disconnect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('disconnect timeout')), 5000)
        )
      ]).catch(() => {});
    };
    
    console.error('[session] Connected to Chrome, created new tab');
    return { browser, page, options, close };
  }

  // Case 3: Launch new browser
  const headless = options.headless ?? false;
  const slowMo = options.slowMo ?? 0;
  
  console.error(`[session] Launching Chrome (headless: ${headless})`);
  
  browser = await puppeteer.launch({
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
    await Promise.race([
      browser.close(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('close timeout')), 5000)
      )
    ]).catch(() => {});
  };
  
  console.error('[session] Browser launched');
  return { browser, page, options, close };
}
