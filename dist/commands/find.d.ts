/**
 * find command - Find elements by text content
 *
 * Usage:
 *   browser find "Accept" --tab abc123           # Find elements with "Accept" text
 *   browser find "Submit" --tag button           # Find buttons with "Submit" text
 *   browser find "Login" --exact --tab abc123    # Find elements with exact "Login" text
 */
import { Page } from 'puppeteer-core';
export interface FindOptions {
    url?: string;
    tag?: string;
    exact?: boolean;
    role?: string;
    ariaLabel?: string;
    timeout?: number;
}
export interface FoundElement {
    selector: string;
    tag: string;
    text: string;
    type?: string;
    name?: string;
    href?: string;
    bounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export declare function find(page: Page, text: string, options?: FindOptions): Promise<void>;
//# sourceMappingURL=find.d.ts.map