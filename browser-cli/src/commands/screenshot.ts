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
}

export async function screenshot(page: Page, outputPath: string, options: ScreenshotOptions = {}): Promise<void> {
  const url = options.url;
  const fullPage = options.fullPage ?? false;
  const type = options.type || 'png';
  const quality = options.quality ? parseInt(options.quality.toString()) : 80;
  
  // Navigate if URL provided
  if (url) {
    console.error(`[screenshot] Navigating to ${url} first`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  
  console.error(`[screenshot] Capturing screenshot to ${outputPath}`);
  console.error(`[screenshot] Full page: ${fullPage}, Type: ${type}`);
  
  try {
    const outputDir = path.dirname(outputPath);
    if (outputDir && outputDir !== '.' && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.error(`[screenshot] Created directory: ${outputDir}`);
    }
    
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
    
    // Get actual Chrome tab ID via CDP
    const client = await page.target().createCDPSession();
    const { targetInfo } = await client.send('Target.getTargetInfo');
    const tabId = targetInfo.targetId;
    
    console.log(JSON.stringify({
      success: true,
      tabId,
      path: outputPath,
      size: stats.size,
      sizeKB,
      fullPage,
      type,
      url: pageUrl,
      title,
    }));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[screenshot] Failed: ${msg}`);
    console.log(JSON.stringify({
      success: false,
      error: msg,
      outputPath,
    }));
    process.exit(2);
  }
}
