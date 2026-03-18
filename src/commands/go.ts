/**
 * go command - Navigate to URL
 */

import { Page } from 'puppeteer-core';
import { withTimeout } from '../utils/timeout';

export interface GoOptions {
  waitLoadState?: 'domcontentloaded' | 'networkidle0' | 'networkidle2' | 'load';
  timeout?: number;
}

export async function go(page: Page, url: string, options: GoOptions = {}): Promise<void> {
  const waitLoadState = options.waitLoadState || 'domcontentloaded';
  const timeout = options.timeout || 120000;
  const startTime = Date.now();
  const startTs = new Date().toISOString();
  
  console.error(`[${startTs}] [go] Navigating to ${url} (wait: ${waitLoadState}, timeout: ${timeout}ms)`);
  
  // Ensure URL has protocol
  let targetUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
    targetUrl = `https://${url}`;
    console.error(`[go] Added https:// prefix: ${targetUrl}`);
  }
  
  try {
    // Create timeout wrapper for entire operation
    const operationPromise = (async () => {
      await page.goto(targetUrl, {
        waitUntil: waitLoadState,
        timeout: timeout,
      });
      
      const title = await page.evaluate(() => document.title);
      const finalUrl = page.url();
      
      // Get actual Chrome tab ID via CDP
      const client = await page.target().createCDPSession();
      const { targetInfo } = await client.send('Target.getTargetInfo');
      const tabId = targetInfo.targetId;
      await client.detach();
      
      return { tabId, title, finalUrl };
    })();
    
    const result = await withTimeout(operationPromise, timeout, 'Navigation');
    
    const elapsed = Date.now() - startTime;
    console.error(`[go] Navigation completed in ${elapsed}ms`);
    
    console.log(JSON.stringify({
      success: true,
      tabId: result.tabId,
      url: targetUrl,
      title: result.title,
      finalUrl: result.finalUrl,
    }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    const endTs = new Date().toISOString();
    console.error(`[${endTs}] [go] Failed after ${elapsed}ms: ${error.message}`);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      url: targetUrl,
      elapsed,
      startTime: startTs,
      endTime: endTs,
    }));
    process.exit(2);
  }
}
