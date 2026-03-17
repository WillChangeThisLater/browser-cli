/**
 * scroll command - Scroll the viewport
 */
import { Page } from 'puppeteer-core';
export interface ScrollOptions {
    url?: string;
    direction?: 'up' | 'down';
    y?: number;
    x?: number;
    selector?: string;
    timeout?: number;
}
export declare function scroll(page: Page, options?: ScrollOptions): Promise<void>;
//# sourceMappingURL=scroll.d.ts.map