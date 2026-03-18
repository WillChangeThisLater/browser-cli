/**
 * scroll command - Scroll the viewport
 */

import { Page } from 'puppeteer-core';
import { withTimeout } from '../utils/timeout';

export interface ScrollOptions {
  url?: string;
  direction?: 'up' | 'down';
  y?: number;
  x?: number;
  selector?: string;
  timeout?: number;
}

export async function scroll(page: Page, options: ScrollOptions = {}): Promise<void> {
  const url = options.url;
  const direction = options.direction;
  const y = options.y;
  const x = options.x || 0;
  const selector = options.selector;
  const timeout = options.timeout || 120000;
  const startTime = Date.now();
  
  // Navigate if URL provided
  if (url) {
    console.error(`[scroll] Navigating to ${url} first (timeout: ${timeout}ms)`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
  }
  
  console.error(`[scroll] Scrolling${direction ? ` ${direction}` : ''}${y ? ` by ${y}px` : ''}${selector ? ` to ${selector}` : ''}`);
  
  try {
    const operationPromise = (async () => {
      let scrollResult: { x: number; y: number };
      
      if (selector) {
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
        const delta = direction === 'down' ? 1 : -1;
        scrollResult = await page.evaluate((pageDelta: number) => {
          const scrollAmount = window.innerHeight * 0.9;
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
      
      const client = await page.target().createCDPSession();
      const { targetInfo } = await client.send('Target.getTargetInfo');
      const tabId = targetInfo.targetId;
      
      return { tabId, pageUrl, title, scrollResult };
    })();
    
    const result = await withTimeout(operationPromise, timeout, 'Scroll operation');
    
    const elapsed = Date.now() - startTime;
    console.error(`[scroll] Completed in ${elapsed}ms`);
    
    console.log(JSON.stringify({
      success: true,
      tabId: result.tabId,
      url: result.pageUrl,
      title: result.title,
      scrollPosition: result.scrollResult,
    }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[scroll] Failed after ${elapsed}ms: ${error.message}`);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      elapsed,
    }));
    process.exit(2);
  }
}
