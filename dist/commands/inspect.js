"use strict";
/**
 * inspect command - Return structured information about page elements
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspect = inspect;
async function inspect(page, selector, options = {}) {
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
            let elements;
            if (selector) {
                const result = await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (!el)
                        return null;
                    const rect = el.getBoundingClientRect();
                    const attrs = {};
                    for (let i = 0; i < el.attributes.length; i++) {
                        const attr = el.attributes[i];
                        attrs[attr.name] = attr.value;
                    }
                    return {
                        selector: sel,
                        tag: el.tagName.toLowerCase(),
                        text: el.innerText?.slice(0, 200) || undefined,
                        type: el.type || undefined,
                        name: el.name || undefined,
                        placeholder: el.placeholder || undefined,
                        href: el.href || undefined,
                        visible: el.offsetParent !== null,
                        bounds: {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                        },
                        attributes: attrs,
                    };
                }, selector);
                if (!result) {
                    throw new Error(`Element not found: ${selector}`);
                }
                elements = result;
            }
            else if (all) {
                const result = await page.evaluate((maxDepth) => {
                    function buildTree(el, currentDepth) {
                        if (currentDepth > maxDepth)
                            return null;
                        const htmlEl = el;
                        const rect = el.getBoundingClientRect();
                        const attrs = {};
                        for (let i = 0; i < el.attributes.length; i++) {
                            const attr = el.attributes[i];
                            attrs[attr.name] = attr.value;
                        }
                        const info = {
                            selector: el.id ? `#${el.id}` :
                                el.className ? `${el.tagName.toLowerCase()}.${el.className.split(' ')[0]}` :
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
                        const children = [];
                        for (let i = 0; i < el.children.length; i++) {
                            const child = el.children[i];
                            const childInfo = buildTree(child, currentDepth + 1);
                            if (childInfo)
                                children.push(childInfo);
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
            }
            else {
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
                    const results = [];
                    for (let i = 0; i < nodeList.length; i++) {
                        const el = nodeList[i];
                        if (el.offsetParent === null)
                            continue;
                        if (el.disabled)
                            continue;
                        const rect = el.getBoundingClientRect();
                        if (rect.width < 5 || rect.height < 5)
                            continue;
                        const info = {
                            selector: el.id ? `#${el.id}` :
                                el.className ?
                                    `${el.tagName.toLowerCase()}.${el.className.split(' ')[0]}` :
                                    el.tagName.toLowerCase(),
                            tag: el.tagName.toLowerCase(),
                            text: el.innerText?.trim().slice(0, 100) || undefined,
                            type: el.type || undefined,
                            name: el.name || undefined,
                            placeholder: el.placeholder || undefined,
                            href: el.href || undefined,
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
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout));
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
    }
    catch (error) {
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
//# sourceMappingURL=inspect.js.map