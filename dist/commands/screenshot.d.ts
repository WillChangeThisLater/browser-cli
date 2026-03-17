/**
 * screenshot command - Capture viewport or full page
 */
import { Page } from 'puppeteer-core';
export interface ScreenshotOptions {
    url?: string;
    fullPage?: boolean;
    type?: 'png' | 'jpeg';
    quality?: number;
    timeout?: number;
}
export declare function screenshot(page: Page, outputPath: string, options?: ScreenshotOptions): Promise<void>;
//# sourceMappingURL=screenshot.d.ts.map