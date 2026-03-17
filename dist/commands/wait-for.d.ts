/**
 * wait-for command - Wait for an element to appear
 *
 * Usage:
 *   browser wait-for "#content" --tab abc123           # Wait for element
 *   browser wait-for ".loaded" --timeout 10000         # With timeout
 *   browser wait-for "#btn" --tab abc123 --visible     # Wait for visible element
 */
import { Page } from 'puppeteer-core';
export interface WaitForOptions {
    url?: string;
    visible?: boolean;
    hidden?: boolean;
    timeout?: number;
}
export declare function waitFor(page: Page, selector: string, options?: WaitForOptions): Promise<void>;
//# sourceMappingURL=wait-for.d.ts.map