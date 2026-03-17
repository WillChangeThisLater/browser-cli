"use strict";
/**
 * go command - Navigate to URL
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.go = go;
async function go(page, url, options = {}) {
    const waitLoadState = options.waitLoadState || 'domcontentloaded';
    const timeout = options.timeout || 120000;
    const startTime = Date.now();
    console.error(`[go] Navigating to ${url} (wait: ${waitLoadState}, timeout: ${timeout}ms)`);
    // Ensure URL has protocol
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
        targetUrl = `https://${url}`;
        console.error(`[go] Added https:// prefix: ${targetUrl}`);
    }
    try {
        // Create timeout wrapper for entire operation
        const operationPromise = (async () => {
            await page.goto(targetUrl, {
                waitUntil: waitLoadState,
                timeout: timeout,
            });
            const title = await page.evaluate(() => document.title);
            const finalUrl = page.url();
            // Get actual Chrome tab ID via CDP
            const client = await page.target().createCDPSession();
            const { targetInfo } = await client.send('Target.getTargetInfo');
            const tabId = targetInfo.targetId;
            return { tabId, title, finalUrl };
        })();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout));
        const result = await Promise.race([operationPromise, timeoutPromise]);
        const elapsed = Date.now() - startTime;
        console.error(`[go] Navigation completed in ${elapsed}ms`);
        console.log(JSON.stringify({
            success: true,
            tabId: result.tabId,
            url: targetUrl,
            title: result.title,
            finalUrl: result.finalUrl,
        }));
    }
    catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`[go] Failed after ${elapsed}ms: ${error.message}`);
        console.log(JSON.stringify({
            success: false,
            error: error.message,
            url: targetUrl,
            elapsed,
        }));
        process.exit(2);
    }
}
//# sourceMappingURL=go.js.map