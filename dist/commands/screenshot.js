"use strict";
/**
 * screenshot command - Capture viewport or full page
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenshot = screenshot;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function screenshot(page, outputPath, options = {}) {
    const url = options.url;
    const fullPage = options.fullPage ?? false;
    const type = options.type || 'png';
    const quality = options.quality ? parseInt(options.quality.toString()) : 80;
    const timeout = options.timeout || 120000;
    const startTime = Date.now();
    // Navigate if URL provided
    if (url) {
        console.error(`[screenshot] Navigating to ${url} first (timeout: ${timeout}ms)`);
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            targetUrl = `https://${url}`;
        }
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: timeout });
    }
    const operationStartTime = Date.now();
    console.error(`[screenshot] Capturing screenshot to ${outputPath}`);
    console.error(`[screenshot] Full page: ${fullPage}, Type: ${type}`);
    try {
        const outputDir = path.dirname(outputPath);
        if (outputDir && outputDir !== '.' && !fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.error(`[screenshot] Created directory: ${outputDir}`);
        }
        const operationPromise = (async () => {
            const imageBuffer = await page.screenshot({
                type,
                fullPage,
                quality: type === 'jpeg' ? quality : undefined,
            });
            fs.writeFileSync(outputPath, imageBuffer);
            const stats = fs.statSync(outputPath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.error(`[screenshot] Saved to ${outputPath} (${sizeKB} KB)`);
            const pageUrl = page.url();
            const title = await page.evaluate(() => document.title);
            const client = await page.target().createCDPSession();
            const { targetInfo } = await client.send('Target.getTargetInfo');
            const tabId = targetInfo.targetId;
            return { tabId, pageUrl, title, size: stats.size, sizeKB, fullPage, type };
        })();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout));
        const result = await Promise.race([operationPromise, timeoutPromise]);
        const elapsed = Date.now() - startTime;
        const captureElapsed = Date.now() - operationStartTime;
        console.error(`[screenshot] Completed in ${elapsed}ms (capture: ${captureElapsed}ms)`);
        console.log(JSON.stringify({
            success: true,
            tabId: result.tabId,
            path: outputPath,
            size: result.size,
            sizeKB: result.sizeKB,
            fullPage: result.fullPage,
            type: result.type,
            url: result.pageUrl,
            title: result.title,
        }));
    }
    catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`[screenshot] Failed after ${elapsed}ms: ${error.message}`);
        console.log(JSON.stringify({
            success: false,
            error: error.message,
            outputPath,
            elapsed,
        }));
        process.exit(2);
    }
}
//# sourceMappingURL=screenshot.js.map