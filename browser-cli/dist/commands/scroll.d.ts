/**
 * scroll command - Scroll the viewport
 *
 * Usage:
 *   browser scroll down --tab abc123           # Scroll one page down
 *   browser scroll up --tab abc123             # Scroll one page up
 *   browser scroll to --selector "#comments"   # Scroll to element
 *   browser scroll by --y 500                  # Scroll by pixels
 */
import { Page } from 'puppeteer-core';
export interface ScrollOptions {
    url?: string;
    direction?: 'up' | 'down';
    y?: number;
    x?: number;
    selector?: string;
}
export declare function scroll(page: Page, options?: ScrollOptions): Promise<void>;
//# sourceMappingURL=scroll.d.ts.map