/**
 * type command - Type text into input field
 */

import { Page } from 'puppeteer-core';

export interface TypeOptions {
  url?: string;
  clear?: boolean;
  wait?: number;
  enter?: boolean;
  timeout?: number;
}

export async function type(page: Page, selector: string, text: string, options: TypeOptions = {}): Promise<void> {
  const url = options.url;
  const clear = options.clear ?? false;
  const wait = options.wait || 0;
  const timeout = options.timeout || 120000;
  const startTime = Date.now();
  
  // Navigate if URL provided
  if (url) {
    console.error(`[type] Navigating to ${url} first (timeout: ${timeout}ms)`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
  }
  
  console.error(`[type] Typing into selector: ${selector} (timeout: ${timeout}ms)`);
  console.error(`[type] Text: ${text}`);
  
  try {
    const operationPromise = (async () => {
      await page.waitForSelector(selector, {
        visible: true,
        timeout: timeout,
      });
      
      if (clear) {
        console.error(`[type] Clearing input first`);
        await page.evaluate((sel: string) => {
          const el = document.querySelector(sel) as HTMLInputElement;
          if (el) el.value = '';
        }, selector);
      }
      
      await page.type(selector, text);
      
      if (options.enter) {
        console.error(`[type] Submitting form (Enter)`);
        await page.evaluate((sel: string) => {
          const input = document.querySelector(sel) as HTMLElement;
          if (!input) return;
          const form = input.closest('form') as HTMLFormElement;
          if (form) {
            form.submit();
          } else {
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
          }
        }, selector);
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: timeout }).catch(() => {});
      }
      
      if (wait > 0) {
        console.error(`[type] Waiting ${wait}ms`);
        await new Promise(resolve => setTimeout(resolve, wait));
      }
      
      const pageUrl = page.url();
      const title = await page.evaluate(() => document.title);
      const inputValue = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLInputElement;
        return el ? el.value : null;
      }, selector);
      
      const client = await page.target().createCDPSession();
      const { targetInfo } = await client.send('Target.getTargetInfo');
      const tabId = targetInfo.targetId;
      
      return { tabId, pageUrl, title, inputValue };
    })();
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
    );
    
    const result = await Promise.race([operationPromise, timeoutPromise]);
    
    const elapsed = Date.now() - startTime;
    console.error(`[type] Text entered successfully (${elapsed}ms)`);
    
    console.log(JSON.stringify({
      success: true,
      tabId: result.tabId,
      selector,
      text,
      actualValue: result.inputValue,
      url: result.pageUrl,
      title: result.title,
    }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[type] Failed after ${elapsed}ms: ${error.message}`);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      selector,
      text,
      elapsed,
    }));
    process.exit(2);
  }
}
