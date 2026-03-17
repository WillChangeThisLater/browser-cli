/**
 * inspect command - Return structured information about page elements
 *
 * Default mode: Returns only interactive/actionable elements (buttons, inputs, links, etc.)
 * --all mode: Returns full DOM tree up to specified depth
 * <selector> mode: Returns detailed info about a specific element
 */
import { Page } from 'puppeteer-core';
export interface InspectOptions {
    url?: string;
    all?: boolean;
    depth?: number;
    selector?: string;
}
export interface ElementInfo {
    selector: string;
    tag: string;
    text?: string;
    type?: string;
    name?: string;
    placeholder?: string;
    href?: string;
    visible?: boolean;
    bounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    attributes?: Record<string, string>;
    children?: ElementInfo[];
}
export declare function inspect(page: Page, selector: string | undefined, options?: InspectOptions): Promise<void>;
//# sourceMappingURL=inspect.d.ts.map