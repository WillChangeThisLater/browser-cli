/**
 * inspect command - Return structured information about page elements
 */
import { Page } from 'puppeteer-core';
export interface InspectOptions {
    url?: string;
    all?: boolean;
    depth?: number;
    selector?: string;
    aria?: boolean;
    timeout?: number;
}
export interface AriaInfo {
    role?: string;
    label?: string;
    labelledBy?: string;
    describedBy?: string;
    expanded?: string;
    pressed?: string;
    selected?: string;
    checked?: string;
    disabled?: string;
    hidden?: string;
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
    aria?: AriaInfo;
    attributes?: Record<string, string>;
    children?: ElementInfo[];
}
export declare function inspect(page: Page, selector: string | undefined, options?: InspectOptions): Promise<void>;
//# sourceMappingURL=inspect.d.ts.map