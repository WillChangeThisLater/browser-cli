/**
 * inspect command - Return structured information about page elements
 */

import { Page } from 'puppeteer-core';

export interface InspectOptions {
  url?: string;
  all?: boolean;
  depth?: number;
  selector?: string;
  timeout?: number;
}

export interface ElementInfo {
  selector: string;
  tag: string;
  text?: string;
  type?: string;
  name?: string;
  placeholder?: string;
  href?: string;
  visible?: boolean;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes?: Record<string, string>;
  children?: ElementInfo[];
}

export async function inspect(page: Page, selector: string | undefined, options: InspectOptions = {}): Promise<void> {
  const url = options.url;
  const all = options.all ?? false;
  const depth = options.depth ?? 5;
  const timeout = options.timeout || 120000;
  const startTime = Date.now();
  
  // Navigate if URL provided
  if (url) {
    console.error(`[inspect] Navigating to ${url} first (timeout: ${timeout}ms)`);
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      targetUrl = `https://${url}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
  }
  
  console.error(`[inspect] Inspecting page${selector ? ` (selector: ${selector})` : ''}${all ? ' (full DOM)' : ' (interactive only)'}`);
  
  try {
    const operationPromise = (async () => {
      let elements: ElementInfo | ElementInfo[];
      
      if (selector) {
        const result = await page.evaluate((sel: string) => {
          const el = document.querySelector(sel) as HTMLElement;
          if (!el) return null;
          
          const rect = el.getBoundingClientRect();
          const attrs: Record<string, string> = {};
          for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            attrs[attr.name] = attr.value;
          }
          
          return {
            selector: sel,
            tag: el.tagName.toLowerCase(),
            text: el.innerText?.slice(0, 200) || undefined,
            type: (el as HTMLInputElement).type || undefined,
            name: (el as HTMLInputElement).name || undefined,
            placeholder: (el as HTMLInputElement).placeholder || undefined,
            href: (el as HTMLAnchorElement).href || undefined,
            visible: el.offsetParent !== null,
            bounds: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
            attributes: attrs,
          } as ElementInfo;
        }, selector);
        
        if (!result) {
          throw new Error(`Element not found: ${selector}`);
        }
        elements = result;
      } else if (all) {
        const result = await page.evaluate((maxDepth: number) => {
          function buildTree(el: Element, currentDepth: number): ElementInfo | null {
            if (currentDepth > maxDepth) return null;
            
            const htmlEl = el as HTMLElement;
            const rect = el.getBoundingClientRect();
            const attrs: Record<string, string> = {};
            for (let i = 0; i < el.attributes.length; i++) {
              const attr = el.attributes[i];
              attrs[attr.name] = attr.value;
            }
            
            const info: ElementInfo = {
              selector: el.id ? `#${el.id}` : 
                        el.className ? `${el.tagName.toLowerCase()}.${(el.className as string).split(' ')[0]}` :
                        el.tagName.toLowerCase(),
              tag: el.tagName.toLowerCase(),
              text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 
                ? el.textContent?.trim().slice(0, 100) || undefined
                : undefined,
              visible: htmlEl.offsetParent !== null,
              bounds: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
              attributes: attrs,
            };
            
            const children: ElementInfo[] = [];
            for (let i = 0; i < el.children.length; i++) {
              const child = el.children[i];
              const childInfo = buildTree(child, currentDepth + 1);
              if (childInfo) children.push(childInfo);
            }
            
            if (children.length > 0) {
              info.children = children;
            }
            
            return info;
          }
          
          return buildTree(document.documentElement, 0);
        }, depth);
        
        if (!result) {
          throw new Error('Failed to build DOM tree');
        }
        elements = result;
      } else {
        elements = await page.evaluate(() => {
          const interactiveSelectors = [
            'button',
            'a[href]',
            'input:not([type="hidden"])',
            'textarea',
            'select',
            '[role="button"]',
            '[role="link"]',
            '[role="textbox"]',
            '[onclick]',
            '[tabindex]:not([tabindex="-1"])',
          ];
          
          const selector = interactiveSelectors.join(', ');
          const nodeList = document.querySelectorAll(selector);
          
          const results: ElementInfo[] = [];
          
          for (let i = 0; i < nodeList.length; i++) {
            const el = nodeList[i] as HTMLElement;
            
            if (el.offsetParent === null) continue;
            if ((el as HTMLInputElement).disabled) continue;
            
            const rect = el.getBoundingClientRect();
            if (rect.width < 5 || rect.height < 5) continue;
            
            const info: ElementInfo = {
              selector: el.id ? `#${el.id}` : 
                        el.className ? 
                          `${el.tagName.toLowerCase()}.${(el.className as string).split(' ')[0]}` :
                          el.tagName.toLowerCase(),
              tag: el.tagName.toLowerCase(),
              text: el.innerText?.trim().slice(0, 100) || undefined,
              type: (el as HTMLInputElement).type || undefined,
              name: (el as HTMLInputElement).name || undefined,
              placeholder: (el as HTMLInputElement).placeholder || undefined,
              href: (el as HTMLAnchorElement).href || undefined,
              visible: el.offsetParent !== null,
              bounds: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
            };
            
            results.push(info);
          }
          
          results.sort((a, b) => {
            if (Math.abs((a.bounds?.y || 0) - (b.bounds?.y || 0)) > 20) {
              return (a.bounds?.y || 0) - (b.bounds?.y || 0);
            }
            return (a.bounds?.x || 0) - (b.bounds?.x || 0);
          });
          
          return results;
        });
      }
      
      const pageUrl = page.url();
      const title = await page.evaluate(() => document.title);
      
      const client = await page.target().createCDPSession();
      const { targetInfo } = await client.send('Target.getTargetInfo');
      const tabId = targetInfo.targetId;
      
      return { tabId, pageUrl, title, elements };
    })();
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
    );
    
    const result = await Promise.race([operationPromise, timeoutPromise]);
    
    const elapsed = Date.now() - startTime;
    console.error(`[inspect] Completed in ${elapsed}ms`);
    
    console.log(JSON.stringify({
      success: true,
      tabId: result.tabId,
      url: result.pageUrl,
      title: result.title,
      mode: selector ? 'selector' : (all ? 'all' : 'interactive'),
      elements: result.elements,
    }));
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[inspect] Failed after ${elapsed}ms: ${error.message}`);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      elapsed,
    }));
    process.exit(2);
  }
}
