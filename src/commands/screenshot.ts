/**
 * screenshot command - Capture viewport or full page
 */

import { Page } from 'puppeteer-core';
import { withTimeout } from '../utils/timeout';
import { CliError } from '../utils/cli';
import * as fs from 'fs';
import * as path from 'path';

export interface ScreenshotOptions {
  url?: string;
  fullPage?: boolean;
  type?: 'png' | 'jpeg';
  quality?: number;
  timeout?: number;
  element?: string;
  offset?: number;
  noScroll?: boolean;
  visible?: boolean;
  wait?: number;
}

export async function screenshot(page: Page, outputPath: string, options: ScreenshotOptions = {}): Promise<void> {
  const url = options.url;
  const fullPage = options.fullPage ?? false;
  const element = options.element;
  const offset = options.offset || 0;
  const noScroll = options.noScroll ?? false;
  const scroll = !noScroll && element !== undefined; // Scroll is implied when --element is used
  const visible = options.visible ?? true;
  const wait = options.wait || 0;
  const type = options.type || 'png';
  const quality = options.quality ? parseInt(options.quality.toString()) : 80;
  const timeout = options.timeout || 120000;
  const startTime = Date.now();
  const operationStartTime = Date.now();
  
  // Validate: element and fullPage are mutually exclusive
  if (element && fullPage) {
    throw new Error('Cannot use --element with --full-page');
  }
  
  // Navigate if URL provided
  if (url) {
    console.error(`[screenshot] Navigating to ${url} first (timeout: ${timeout}ms)`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
  }
  
  // Describe what we're capturing
  const elementSelector = element ? `element: ${element} (scroll: ${scroll})` : fullPage ? 'fullPage' : 'viewport';
  console.error(`[screenshot] Capturing screenshot to ${outputPath} (${elementSelector})`);
  console.error(`[screenshot] Type: ${type}, Quality: ${quality}, Offset: ${offset}`);
  
  try {
    const outputDir = path.dirname(outputPath);
    if (outputDir && outputDir !== '.' && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.error(`[screenshot] Created directory: ${outputDir}`);
    }
    
    const operationPromise = (async () => {
      let screenshotOptions: any = {
        type,
        fullPage,
        quality: type === 'jpeg' ? quality : undefined,
      };
      
      // Add element selector if provided
      if (element) {
        // Scroll into view if not opted-out
        if (scroll) {
          console.error(`[screenshot] Scrolling element into view...`);
          await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, element);
          await new Promise(resolve => setTimeout(resolve, wait || 500));
        }
        
        // Check visibility if requested
        if (visible) {
          const isVisible = await page.$(element) !== null;
          if (!isVisible) {
            console.error(`[screenshot] Warning: Element "${element}" not found`);
          }
        }
        
        // Get element's bounding box and position
        const bboxResult = await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          const rect = el?.getBoundingClientRect();
          if (!rect) return null;
          return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          };
        }, element);
        
        if (!bboxResult) {
          throw new Error(`Could not get bounding box for element "${element}"`);
        }
        
        const { x, y, width, height } = bboxResult;
        
        // Calculate screenshot area with offset
        const offset = options.offset || 0;
        const screenshotArea = {
          x: Math.max(0, x - offset),
          y: Math.max(0, y - offset),
          width: width + (offset * 2),
          height: height + (offset * 2),
        };
        
        // Use viewport screenshot with clip for element capture
        screenshotOptions.clip = screenshotArea;
        console.error(`[screenshot] Capturing element "${element}" with offset ${offset}px`);
      } else if (!fullPage) {
        // Default viewport screenshot
        console.error(`[screenshot] Capturing viewport`);
      }
      
      const imageBuffer = await page.screenshot(screenshotOptions);
      
      fs.writeFileSync(outputPath, imageBuffer as unknown as Buffer);
      
      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      console.error(`[screenshot] Saved to ${outputPath} (${sizeKB} KB)`);
      
      const pageUrl = page.url();
      const title = await page.evaluate(() => document.title);
      
      const client = await page.target().createCDPSession();
      const { targetInfo } = await client.send('Target.getTargetInfo');
      const tabId = targetInfo.targetId;
      await client.detach();
      
      return { tabId, pageUrl, title, size: stats.size, sizeKB, fullPage, type, element };
    })();
    
    const result = await withTimeout(operationPromise, timeout, 'Screenshot operation');
    
    const elapsed = Date.now() - startTime;
    const captureElapsed = Date.now() - operationStartTime;
    console.error(`[screenshot] Completed in ${elapsed}ms (capture: ${captureElapsed}ms)`);
    
    console.log(JSON.stringify({
      success: true,
      tabId: result.tabId,
      path: outputPath,
      size: result.size,
      sizeKB: result.sizeKB,
      fullPage: result.fullPage,
      type: result.type,
      element: result.element,
      url: result.pageUrl,
      title: result.title,
    }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[screenshot] Failed after ${elapsed}ms: ${error.message}`);
    throw new CliError({
      success: false,
      error: error.message,
      outputPath,
      elapsed
    }, 2);
  }
}
