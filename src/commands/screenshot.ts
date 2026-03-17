/**
 * screenshot command - Capture viewport or full page
 */

import { Page } from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';

export interface ScreenshotOptions {
  url?: string;
  fullPage?: boolean;
  type?: 'png' | 'jpeg';
  quality?: number;
  timeout?: number;
}

export async function screenshot(page: Page, outputPath: string, options: ScreenshotOptions = {}): Promise<void> {
  const url = options.url;
  const fullPage = options.fullPage ?? false;
  const type = options.type || 'png';
  const quality = options.quality ? parseInt(options.quality.toString()) : 80;
  const timeout = options.timeout || 120000;
  const startTime = Date.now();
  
  // Navigate if URL provided
  if (url) {
    console.error(`[screenshot] Navigating to ${url} first (timeout: ${timeout}ms)`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
  }
  
  const operationStartTime = Date.now();
  console.error(`[screenshot] Capturing screenshot to ${outputPath}`);
  console.error(`[screenshot] Full page: ${fullPage}, Type: ${type}`);
  
  try {
    const outputDir = path.dirname(outputPath);
    if (outputDir && outputDir !== '.' && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.error(`[screenshot] Created directory: ${outputDir}`);
    }
    
    const operationPromise = (async () => {
      const imageBuffer = await page.screenshot({
        type,
        fullPage,
        quality: type === 'jpeg' ? quality : undefined,
      });
      
      fs.writeFileSync(outputPath, imageBuffer as Buffer);
      
      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      console.error(`[screenshot] Saved to ${outputPath} (${sizeKB} KB)`);
      
      const pageUrl = page.url();
      const title = await page.evaluate(() => document.title);
      
      const client = await page.target().createCDPSession();
      const { targetInfo } = await client.send('Target.getTargetInfo');
      const tabId = targetInfo.targetId;
      
      return { tabId, pageUrl, title, size: stats.size, sizeKB, fullPage, type };
    })();
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
    );
    
    const result = await Promise.race([operationPromise, timeoutPromise]);
    
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
      url: result.pageUrl,
      title: result.title,
    }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[screenshot] Failed after ${elapsed}ms: ${error.message}`);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      outputPath,
      elapsed,
    }));
    process.exit(2);
  }
}
