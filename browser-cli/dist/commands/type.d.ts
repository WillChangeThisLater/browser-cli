/**
 * type command - Type text into input field
 */
import { Page } from 'puppeteer-core';
export interface TypeOptions {
    url?: string;
    clear?: boolean;
    wait?: number;
    enter?: boolean;
}
export declare function type(page: Page, selector: string, text: string, options?: TypeOptions): Promise<void>;
//# sourceMappingURL=type.d.ts.map