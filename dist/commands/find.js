"use strict";
/**
 * find command - Find elements by text content
 *
 * Usage:
 *   browser find "Accept" --tab abc123           # Find elements with "Accept" text
 *   browser find "Submit" --tag button           # Find buttons with "Submit" text
 *   browser find "Login" --exact --tab abc123    # Find elements with exact "Login" text
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.find = find;
async function find(page, text, options = {}) {
    const url = options.url;
    const tag = options.tag;
    const exact = options.exact ?? false;
    const timeout = options.timeout || 120000;
    const startTime = Date.now();
    // Navigate if URL provided
    if (url) {
        console.error(`[find] Navigating to ${url} first (timeout: ${timeout}ms)`);
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            targetUrl = `https://${url}`;
        }
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
    }
    console.error(`[find] Searching for "${text}"${tag ? ` in <${tag}>` : ''}${exact ? ' (exact match)' : ''}`);
    try {
        const operationPromise = (async () => {
            const elements = await page.evaluate((searchText, targetTag, exactMatch) => {
                const allElements = document.querySelectorAll('*');
                const results = [];
                for (let i = 0; i < allElements.length; i++) {
                    const el = allElements[i];
                    // Skip hidden elements
                    if (el.offsetParent === null)
                        continue;
                    // Filter by tag if specified
                    if (targetTag && el.tagName.toLowerCase() !== targetTag.toLowerCase())
                        continue;
                    // Get text content
                    const elText = el.innerText?.trim() || el.textContent?.trim() || '';
                    if (!elText)
                        continue;
                    // Check for text match
                    const matches = exactMatch
                        ? elText === searchText
                        : elText.toLowerCase().includes(searchText.toLowerCase());
                    if (!matches)
                        continue;
                    // Skip very long text (likely page content, not actionable element)
                    if (elText.length > 200)
                        continue;
                    const rect = el.getBoundingClientRect();
                    // Skip tiny elements
                    if (rect.width < 5 || rect.height < 5)
                        continue;
                    // Build selector
                    let selector = el.tagName.toLowerCase();
                    if (el.id) {
                        selector = `#${el.id}`;
                    }
                    else if (el.className && typeof el.className === 'string') {
                        const classes = el.className.split(' ').filter(c => c).slice(0, 2);
                        if (classes.length > 0) {
                            selector = `${selector}.${classes.join('.')}`;
                        }
                    }
                    const result = {
                        selector,
                        tag: el.tagName.toLowerCase(),
                        text: elText.slice(0, 100),
                        type: el.type || undefined,
                        name: el.name || undefined,
                        href: el.href || undefined,
                        bounds: {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                        },
                    };
                    results.push(result);
                }
                // Sort by position (top-to-bottom, left-to-right)
                results.sort((a, b) => {
                    if (Math.abs((a.bounds?.y || 0) - (b.bounds?.y || 0)) > 20) {
                        return (a.bounds?.y || 0) - (b.bounds?.y || 0);
                    }
                    return (a.bounds?.x || 0) - (b.bounds?.x || 0);
                });
                // Limit to top 20 results
                return results.slice(0, 20);
            }, text, tag, exact);
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
        console.error(`[find] Found ${result.elements.length} element${result.elements.length !== 1 ? 's' : ''} in ${elapsed}ms`);
        console.log(JSON.stringify({
            success: true,
            tabId: result.tabId,
            search: text,
            tag,
            exact,
            count: result.elements.length,
            elements: result.elements,
            url: result.pageUrl,
            title: result.title,
        }));
    }
    catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`[find] Failed after ${elapsed}ms: ${error.message}`);
        console.log(JSON.stringify({
            success: false,
            error: error.message,
            elapsed,
        }));
        process.exit(2);
    }
}
//# sourceMappingURL=find.js.map