/**
 * click command - Click an element by CSS selector, text, or aria-label.
 *
 * Resolves the real hit-target (walking up from hidden logical elements,
 * e.g. a visually-hidden <input> whose styled ancestor div is the actual
 * click surface), scrolls it into view, and clicks its center using
 * trusted CDP input events (page.mouse), so framework event handlers
 * (React etc.) reliably observe the click — unlike synthetic el.click().
 *
 * Timeouts are per-stage and labeled ('Navigation', 'Target resolution',
 * 'Mouse click', 'Verify evaluation', 'Title evaluation') so a failed click
 * reports WHICH stage stalled; the outer 'Click operation' withTimeout is a
 * safety net only.
 */
import { Page } from 'puppeteer-core';
export interface ClickOptions {
    url?: string;
    wait?: number;
    timeout?: number;
    exact?: boolean;
    verify?: string;
}
export declare function click(page: Page, selector: string, options?: ClickOptions): Promise<void>;
//# sourceMappingURL=click.d.ts.map