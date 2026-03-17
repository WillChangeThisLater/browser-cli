"use strict";
/**
 * inspect command - Return structured information about page elements
 *
 * Default mode: Returns only interactive/actionable elements (buttons, inputs, links, etc.)
 * --all mode: Returns full DOM tree up to specified depth
 * <selector> mode: Returns detailed info about a specific element
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspect = inspect;
async function inspect(page, selector, options = {}) {
    const url = options.url;
    const all = options.all ?? false;
    const depth = options.depth ?? 5;
    // Navigate if URL provided
    if (url) {
        console.error(`[inspect] Navigating to ${url} first`);
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            targetUrl = `https://${url}`;
        }
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    console.error(`[inspect] Inspecting page${selector ? ` (selector: ${selector})` : ''}${all ? ' (full DOM)' : ' (interactive only)'}`);
    try {
        let elements;
        if (selector) {
            // Mode: Inspect specific element
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
                console.error(`[inspect] Element not found: ${selector}`);
                console.log(JSON.stringify({
                    success: false,
                    error: `Element not found: ${selector}`,
                }));
                process.exit(2);
            }
            elements = result;
        }
        else if (all) {
            // Mode: Full DOM tree
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
                console.error('[inspect] Failed to build DOM tree');
                console.log(JSON.stringify({
                    success: false,
                    error: 'Failed to build DOM tree',
                }));
                process.exit(2);
            }
            elements = result;
        }
        else {
            // Mode: Interactive elements only (default)
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
                    // Skip invisible elements
                    if (el.offsetParent === null)
                        continue;
                    // Skip disabled elements
                    if (el.disabled)
                        continue;
                    const rect = el.getBoundingClientRect();
                    // Skip tiny elements (likely icons or decorative)
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
                // Sort by position (top-to-bottom, left-to-right)
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
        // Get tab ID via CDP
        const client = await page.target().createCDPSession();
        const { targetInfo } = await client.send('Target.getTargetInfo');
        const tabId = targetInfo.targetId;
        console.log(JSON.stringify({
            success: true,
            tabId,
            url: pageUrl,
            title,
            mode: selector ? 'selector' : (all ? 'all' : 'interactive'),
            elements,
        }));
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[inspect] Failed: ${msg}`);
        console.log(JSON.stringify({
            success: false,
            error: msg,
        }));
        process.exit(2);
    }
}
//# sourceMappingURL=inspect.js.map