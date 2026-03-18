/**
 * click command - Click element by CSS selector
 */

import { Page } from 'puppeteer-core';
import { withTimeout } from '../utils/timeout';

export interface ClickOptions {
  url?: string;
  wait?: number;
  timeout?: number;
}

export async function click(page: Page, selector: string, options: ClickOptions = {}): Promise<void> {
  const url = options.url;
  const wait = options.wait || 0;
  const timeout = options.timeout || 120000;
  const startTime = Date.now();
  
  // Navigate if URL provided
  if (url) {
    console.error(`[click] Navigating to ${url} first (timeout: ${timeout}ms)`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
  }
  
  console.error(`[click] Clicking selector: ${selector} (timeout: ${timeout}ms)`);
  
  try {
    // Wrap entire operation with timeout
    const operationPromise = (async () => {
      await page.waitForSelector(selector, {
        visible: true,
        timeout: timeout,
      });
      
      await page.click(selector);
      
      if (wait > 0) {
        console.error(`[click] Waiting ${wait}ms`);
        await new Promise(resolve => setTimeout(resolve, wait));
      }
      
      const pageUrl = page.url();
      const title = await page.evaluate(() => document.title);
      
      // Get actual Chrome tab ID via CDP
      const client = await page.target().createCDPSession();
      const { targetInfo } = await client.send('Target.getTargetInfo');
      const tabId = targetInfo.targetId;
      
      return { tabId, pageUrl, title };
    })();
    
    const result = await withTimeout(operationPromise, timeout, 'Click operation');
    
    const elapsed = Date.now() - startTime;
    console.error(`[click] Element clicked successfully (${elapsed}ms)`);
    
    console.log(JSON.stringify({
      success: true,
      tabId: result.tabId,
      selector,
      url: result.pageUrl,
      title: result.title,
    }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[click] Failed after ${elapsed}ms: ${error.message}`);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      selector,
      elapsed,
    }));
    process.exit(2);
  }
}
