/**
 * eval command - Execute JavaScript in page context
 */

import { Page } from 'puppeteer-core';
import { withTimeout } from '../utils/timeout';

export interface EvalOptions {
  url?: string;
  json?: boolean;
  silent?: boolean;
  timeout?: number;
}

export async function evalJs(page: Page, code: string, options: EvalOptions = {}): Promise<void> {
  const url = options.url;
  const json = options.json ?? false;
  const timeout = options.timeout || 120000;
  const startTime = Date.now();
  
  // Navigate if URL provided
  if (url) {
    console.error(`[eval] Navigating to ${url} first (timeout: ${timeout}ms)`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
  }
  
  console.error(`[eval] Executing: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);
  
  try {
    const operationPromise = (async () => {
      const result = await page.evaluate(code);
      
      const pageUrl = page.url();
      const title = await page.evaluate(() => document.title);
      
      const client = await page.target().createCDPSession();
      const { targetInfo } = await client.send('Target.getTargetInfo');
      const tabId = targetInfo.targetId;
      await client.detach();
      
      return { tabId, pageUrl, title, result };
    })();
    
    const result = await withTimeout(operationPromise, timeout, 'JavaScript execution');
    
    const elapsed = Date.now() - startTime;
    if (!options.silent) {
      console.error(`[eval] Completed in ${elapsed}ms`);
    }
    
    const output = json && typeof result.result === 'object' 
      ? JSON.stringify(result.result) 
      : String(result.result);
    
    console.log(JSON.stringify({
      success: true,
      tabId: result.tabId,
      result: output,
      url: result.pageUrl,
      title: result.title,
    }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[eval] Failed after ${elapsed}ms: ${error.message}`);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      elapsed,
    }));
    process.exit(2);
  }
}
