/**
 * go command - Navigate to URL
 */

import { Page } from 'puppeteer-core';

export interface GoOptions {
  waitLoadState?: 'domcontentloaded' | 'networkidle0' | 'networkidle2' | 'load';
}

export async function go(page: Page, url: string, options: GoOptions = {}): Promise<void> {
  const waitLoadState = options.waitLoadState || 'domcontentloaded';
  
  console.error(`[go] Navigating to ${url} (wait: ${waitLoadState})`);
  
  // Ensure URL has protocol
  let targetUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
    targetUrl = `https://${url}`;
    console.error(`[go] Added https:// prefix: ${targetUrl}`);
  }
  
  try {
    await page.goto(targetUrl, {
      waitUntil: waitLoadState,
      timeout: 60000,
    });
    
    const title = await page.evaluate(() => document.title);
    const finalUrl = page.url();
    
    // Get actual Chrome tab ID via CDP
    const client = await page.target().createCDPSession();
    const { targetInfo } = await client.send('Target.getTargetInfo');
    const tabId = targetInfo.targetId;
    
    console.log(JSON.stringify({
      success: true,
      tabId,
      url: targetUrl,
      title,
      finalUrl,
    }));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[go] Navigation failed: ${msg}`);
    console.log(JSON.stringify({
      success: false,
      error: msg,
      url: targetUrl,
    }));
    process.exit(2);
  }
}
