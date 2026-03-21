"use strict";
/**
 * scroll command - Scroll the viewport
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scroll = scroll;
const timeout_1 = require("../utils/timeout");
async function scroll(page, options = {}) {
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
            let scrollResult;
            if (selector) {
                scrollResult = await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
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
            }
            else if (direction === 'up' || direction === 'down') {
                const delta = direction === 'down' ? 1 : -1;
                scrollResult = await page.evaluate((pageDelta) => {
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
            }
            else if (y !== undefined) {
                scrollResult = await page.evaluate((deltaY, deltaX) => {
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
            }
            else {
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
            await client.detach();
            return { tabId, pageUrl, title, scrollResult };
        })();
        const result = await (0, timeout_1.withTimeout)(operationPromise, timeout, 'Scroll operation');
        const elapsed = Date.now() - startTime;
        console.error(`[scroll] Completed in ${elapsed}ms`);
        console.log(JSON.stringify({
            success: true,
            tabId: result.tabId,
            url: result.pageUrl,
            title: result.title,
            scrollPosition: result.scrollResult,
        }));
    }
    catch (error) {
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
//# sourceMappingURL=scroll.js.map