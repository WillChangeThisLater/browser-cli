/**
 * wait-for command - Wait for an element to appear
 * 
 * Usage:
 *   browser wait-for "#content" --tab abc123           # Wait for element
 *   browser wait-for ".loaded" --timeout 10000         # With timeout
 *   browser wait-for "#btn" --tab abc123 --visible     # Wait for visible element
 */

import { Page } from 'puppeteer-core';

export interface WaitForOptions {
  url?: string;
  visible?: boolean;
  hidden?: boolean;
  timeout?: number;
}

export async function waitFor(page: Page, selector: string, options: WaitForOptions = {}): Promise<void> {
  const url = options.url;
  const visible = options.visible ?? true;
  const hidden = options.hidden ?? false;
  const timeout = options.timeout || 120000;
  const startTime = Date.now();
  
  // Navigate if URL provided
  if (url) {
    console.error(`[wait-for] Navigating to ${url} first (timeout: ${timeout}ms)`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
  }
  
  console.error(`[wait-for] Waiting for "${selector}"${visible ? ' (visible)' : ''}${hidden ? ' (hidden)' : ''}`);
  
  try {
    const operationPromise = (async () => {
      await page.waitForSelector(selector, {
        visible,
        hidden,
        timeout,
      });
      
      const pageUrl = page.url();
      const title = await page.evaluate(() => document.title);
      
      const client = await page.target().createCDPSession();
      const { targetInfo } = await client.send('Target.getTargetInfo');
      const tabId = targetInfo.targetId;
      
      return { tabId, pageUrl, title };
    })();
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout)
    );
    
    const result = await Promise.race([operationPromise, timeoutPromise]);
    
    const elapsed = Date.now() - startTime;
    console.error(`[wait-for] Element found in ${elapsed}ms`);
    
    console.log(JSON.stringify({
      success: true,
      tabId: result.tabId,
      selector,
      elapsed,
      url: result.pageUrl,
      title: result.title,
    }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[wait-for] Failed after ${elapsed}ms: ${error.message}`);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      selector,
      elapsed,
    }));
    process.exit(2);
  }
}
