/**
 * click command - Click element by CSS selector
 */
import { Page } from 'puppeteer-core';
export interface ClickOptions {
    url?: string;
    wait?: number;
}
export declare function click(page: Page, selector: string, options?: ClickOptions): Promise<void>;
//# sourceMappingURL=click.d.ts.map