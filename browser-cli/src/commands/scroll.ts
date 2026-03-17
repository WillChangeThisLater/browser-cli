/**
 * scroll command - Scroll the viewport
 * 
 * Usage:
 *   browser scroll down --tab abc123           # Scroll one page down
 *   browser scroll up --tab abc123             # Scroll one page up
 *   browser scroll to --selector "#comments"   # Scroll to element
 *   browser scroll by --y 500                  # Scroll by pixels
 */

import { Page } from 'puppeteer-core';

export interface ScrollOptions {
  url?: string;
  direction?: 'up' | 'down';
  y?: number;
  x?: number;
  selector?: string;
}

export async function scroll(page: Page, options: ScrollOptions = {}): Promise<void> {
  const url = options.url;
  const direction = options.direction;
  const y = options.y;
  const x = options.x || 0;
  const selector = options.selector;
  
  // Navigate if URL provided
  if (url) {
    console.error(`[scroll] Navigating to ${url} first`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  
  console.error(`[scroll] Scrolling${direction ? ` ${direction}` : ''}${y ? ` by ${y}px` : ''}${selector ? ` to ${selector}` : ''}`);
  
  try {
    let scrollResult: { x: number; y: number };
    
    if (selector) {
      // Scroll to element
      scrollResult = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLElement;
        if (!el) {
          throw new Error(`Element not found: ${sel}`);
        }
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return {
          x: window.scrollX,
          y: window.scrollY,
        };
      }, selector);
      
      console.error(`[scroll] Scrolled to element`);
    } else if (direction === 'up' || direction === 'down') {
      // Scroll by page
      const delta = direction === 'down' ? 1 : -1;
      scrollResult = await page.evaluate((pageDelta: number) => {
        const scrollAmount = window.innerHeight * 0.9; // Scroll 90% of viewport
        window.scrollBy({
          top: scrollAmount * pageDelta,
          left: 0,
          behavior: 'smooth',
        });
        return {
          x: window.scrollX,
          y: window.scrollY,
        };
      }, delta);
      
      console.error(`[scroll] Scrolled ${direction} by ~1 page`);
    } else if (y !== undefined) {
      // Scroll by specific amount
      scrollResult = await page.evaluate((deltaY: number, deltaX: number) => {
        window.scrollBy({
          top: deltaY,
          left: deltaX,
          behavior: 'smooth',
        });
        return {
          x: window.scrollX,
          y: window.scrollY,
        };
      }, y, x);
      
      console.error(`[scroll] Scrolled by ${y}px vertical, ${x}px horizontal`);
    } else {
      // Default: scroll down one page
      scrollResult = await page.evaluate(() => {
        const scrollAmount = window.innerHeight * 0.9;
        window.scrollBy({
          top: scrollAmount,
          left: 0,
          behavior: 'smooth',
        });
        return {
          x: window.scrollX,
          y: window.scrollY,
        };
      });
      
      console.error(`[scroll] Scrolled down by ~1 page (default)`);
    }
    
    const pageUrl = page.url();
    const title = await page.evaluate(() => document.title);
    
    // Get tab ID via CDP
    const client = await page.target().createCDPSession();
    const { targetInfo } = await client.send('Target.getTargetInfo');
    const tabId = targetInfo.targetId;
    
    console.log(JSON.stringify({
      success: true,
      tabId,
      url: pageUrl,
      title,
      scrollPosition: scrollResult,
    }));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[scroll] Failed: ${msg}`);
    console.log(JSON.stringify({
      success: false,
      error: msg,
    }));
    process.exit(2);
  }
}
