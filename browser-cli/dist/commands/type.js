"use strict";
/**
 * type command - Type text into input field
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.type = type;
async function type(page, selector, text, options = {}) {
    const url = options.url;
    const clear = options.clear ?? false;
    const wait = options.wait || 0;
    // Navigate if URL provided
    if (url) {
        console.error(`[type] Navigating to ${url} first`);
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            targetUrl = `https://${url}`;
        }
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    console.error(`[type] Typing into selector: ${selector}`);
    console.error(`[type] Text: ${text}`);
    try {
        await page.waitForSelector(selector, {
            visible: true,
            timeout: 10000,
        });
        if (clear) {
            console.error(`[type] Clearing input first`);
            await page.evaluate((sel) => {
                const el = document.querySelector(sel);
                if (el)
                    el.value = '';
            }, selector);
        }
        await page.type(selector, text);
        console.error(`[type] Text entered successfully`);
        if (options.enter) {
            console.error(`[type] Submitting form (Enter)`);
            // Find the closest form and submit it
            await page.evaluate((sel) => {
                const input = document.querySelector(sel);
                if (!input)
                    return;
                const form = input.closest('form');
                if (form) {
                    form.submit();
                }
                else {
                    // Fallback: press Enter key
                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
                }
            }, selector);
            // Wait for navigation
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => { });
        }
        if (wait > 0) {
            console.error(`[type] Waiting ${wait}ms`);
            await new Promise(resolve => setTimeout(resolve, wait));
        }
        const pageUrl = page.url();
        const title = await page.evaluate(() => document.title);
        const inputValue = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            return el ? el.value : null;
        }, selector);
        // Get actual Chrome tab ID via CDP
        const client = await page.target().createCDPSession();
        const { targetInfo } = await client.send('Target.getTargetInfo');
        const tabId = targetInfo.targetId;
        console.log(JSON.stringify({
            success: true,
            tabId,
            selector,
            text,
            actualValue: inputValue,
            url: pageUrl,
            title,
        }));
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[type] Failed: ${msg}`);
        console.log(JSON.stringify({
            success: false,
            error: msg,
            selector,
            text,
        }));
        process.exit(2);
    }
}
//# sourceMappingURL=type.js.map