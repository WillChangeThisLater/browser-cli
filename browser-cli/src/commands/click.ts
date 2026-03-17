/**
 * click command - Click element by CSS selector
 */

import { Page } from 'puppeteer-core';

export interface ClickOptions {
  url?: string;
  wait?: number;
}

export async function click(page: Page, selector: string, options: ClickOptions = {}): Promise<void> {
  const url = options.url;
  const wait = options.wait || 0;
  
  // Navigate if URL provided
  if (url) {
    console.error(`[click] Navigating to ${url} first`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  
  console.error(`[click] Clicking selector: ${selector}`);
  
  try {
    await page.waitForSelector(selector, {
      visible: true,
      timeout: 10000,
    });
    
    await page.click(selector);
    
    console.error(`[click] Element clicked successfully`);
    
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
    
    console.log(JSON.stringify({
      success: true,
      tabId,
      selector,
      url: pageUrl,
      title,
    }));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[click] Failed: ${msg}`);
    console.log(JSON.stringify({
      success: false,
      error: msg,
      selector,
    }));
    process.exit(2);
  }
}
