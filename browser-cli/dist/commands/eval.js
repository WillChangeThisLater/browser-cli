"use strict";
/**
 * eval command - Execute JavaScript in page context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evalJs = evalJs;
async function evalJs(page, code, options = {}) {
    const url = options.url;
    const asJson = options.json ?? false;
    // Navigate if URL provided
    if (url) {
        console.error(`[eval] Navigating to ${url} first`);
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            targetUrl = `https://${url}`;
        }
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    console.error(`[eval] Executing: ${code}`);
    try {
        const result = await page.evaluate(code);
        const pageUrl = page.url();
        const title = await page.evaluate(() => document.title);
        // Get actual Chrome tab ID via CDP
        const client = await page.target().createCDPSession();
        const { targetInfo } = await client.send('Target.getTargetInfo');
        const tabId = targetInfo.targetId;
        console.log(JSON.stringify({
            success: true,
            tabId,
            result: asJson ? result : (typeof result === 'string' ? result : JSON.stringify(result, null, 2)),
            url: pageUrl,
            title,
        }));
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[eval] Failed: ${msg}`);
        console.log(JSON.stringify({
            success: false,
            error: msg,
            code,
        }));
        process.exit(2);
    }
}
//# sourceMappingURL=eval.js.map