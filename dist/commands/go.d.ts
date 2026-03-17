/**
 * go command - Navigate to URL
 */
import { Page } from 'puppeteer-core';
export interface GoOptions {
    waitLoadState?: 'domcontentloaded' | 'networkidle0' | 'networkidle2' | 'load';
    timeout?: number;
}
export declare function go(page: Page, url: string, options?: GoOptions): Promise<void>;
//# sourceMappingURL=go.d.ts.map