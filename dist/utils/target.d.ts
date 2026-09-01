/**
 * target.ts - Shared target resolution for click/aim commands.
 *
 * Resolves a "target spec" to a visible, clickable hit-target element and
 * its viewport coordinates. Handles the two common real-world wrinkles:
 *
 * 1. Text/aria matching: agents usually know "the button that says Save",
 *    not a stable CSS selector. Specs: `css:<sel>` (or bare selector),
 *    `text:<substring>`, `aria:<label substring>`.
 * 2. Hidden logical elements: frameworks (React forms etc.) render the
 *    real <input> invisible and style an ancestor/div as the hit target.
 *    We walk up (max 5 ancestors) to find the first visible box.
 */
import { Page } from 'puppeteer-core';
export interface TargetSpec {
    original: string;
    kind: 'css' | 'text' | 'aria';
    value: string;
    exact: boolean;
}
export declare function parseTarget(target: string, exact?: boolean): TargetSpec;
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface ResolvedTarget {
    spec: TargetSpec;
    matched: {
        tag: string;
        text: string;
        visible: boolean;
    };
    hitTarget: {
        tag: string;
        via: 'self' | 'ancestor';
        level: number;
        text: string;
    };
    rect: Rect;
    center: {
        x: number;
        y: number;
    };
    url: string;
    title: string;
}
export declare function resolveTarget(page: Page, target: string, options?: {
    exact?: boolean;
    timeout?: number;
}): Promise<ResolvedTarget>;
//# sourceMappingURL=target.d.ts.map