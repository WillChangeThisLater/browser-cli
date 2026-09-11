"use strict";
/**
 * click command - Click an element by CSS selector, text, or aria-label.
 *
 * Resolves the real hit-target (walking up from hidden logical elements,
 * e.g. a visually-hidden <input> whose styled ancestor div is the actual
 * click surface), scrolls it into view, and clicks its center using
 * trusted CDP input events (page.mouse), so framework event handlers
 * (React etc.) reliably observe the click — unlike synthetic el.click().
 *
 * Timeouts are per-stage and labeled ('Navigation', 'Target resolution',
 * 'Mouse click', 'Verify evaluation', 'Title evaluation') so a failed click
 * reports WHICH stage stalled; the outer 'Click operation' withTimeout is a
 * safety net only.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.click = click;
const timeout_1 = require("../utils/timeout");
const cli_1 = require("../utils/cli");
const target_1 = require("../utils/target");
async function click(page, selector, options = {}) {
    const url = options.url;
    const wait = options.wait || 0;
    const timeout = options.timeout || 120000;
    const startTime = Date.now();
    // Navigate if URL provided
    if (url) {
        console.error(`[click] Navigating to ${url} first (timeout: ${timeout}ms)`);
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            targetUrl = `https://${url}`;
        }
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
    }
    console.error(`[click] Clicking target: ${selector}`);
    try {
        const operationPromise = (async () => {
            const resolved = await (0, target_1.resolveTarget)(page, selector, { exact: options.exact, timeout });
            console.error(`[click] Resolved: matched <${resolved.matched.tag}>, hit-target <${resolved.hitTarget.tag}> ` +
                `(via ${resolved.hitTarget.via}${resolved.hitTarget.level ? `, +${resolved.hitTarget.level}` : ''}) ` +
                `at (${resolved.center.x}, ${resolved.center.y})`);
            // Trusted input click at the hit-target center. Small dedicated deadline:
            // if the click dispatch itself stalls, the error names this stage instead
            // of surfacing as an anonymous 'Click operation timeout'.
            await (0, timeout_1.withTimeout)(page.mouse.click(resolved.center.x, resolved.center.y), 5000, 'Mouse click');
            if (wait > 0) {
                console.error(`[click] Waiting ${wait}ms`);
                await new Promise(resolve => setTimeout(resolve, wait));
            }
            let verifyResult = undefined;
            if (options.verify) {
                try {
                    const r = await (0, timeout_1.withTimeout)(page.evaluate(`(() => { ${options.verify.startsWith('return') || options.verify.includes(';') ? options.verify : `return (${options.verify});`} })()`), 5000, 'Verify evaluation');
                    verifyResult = r;
                }
                catch (e) {
                    verifyResult = { error: e.message };
                }
            }
            const pageUrl = page.url();
            const title = await (0, timeout_1.withTimeout)(page.evaluate(() => document.title), 5000, 'Title evaluation');
            // Get actual Chrome tab ID via CDP
            const client = await page.target().createCDPSession();
            const { targetInfo } = await client.send('Target.getTargetInfo');
            const tabId = targetInfo.targetId;
            await client.detach();
            return { tabId, pageUrl, title, resolved, verifyResult };
        })();
        const result = await (0, timeout_1.withTimeout)(operationPromise, timeout + 5000, 'Click operation');
        const elapsed = Date.now() - startTime;
        console.error(`[click] Element clicked successfully (${elapsed}ms)`);
        console.log(JSON.stringify({
            success: true,
            tabId: result.tabId,
            selector,
            resolved: {
                matched: result.resolved.matched,
                hitTarget: result.resolved.hitTarget,
                rect: result.resolved.rect,
                center: result.resolved.center,
            },
            verify: result.verifyResult,
            url: result.pageUrl,
            title: result.title,
        }));
    }
    catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`[click] Failed after ${elapsed}ms: ${error.message}`);
        throw new cli_1.CliError({
            success: false,
            error: error.message,
            selector,
            elapsed
        }, 2);
    }
}
//# sourceMappingURL=click.js.map