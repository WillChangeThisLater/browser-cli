/**
 * eval command - Execute JavaScript in page context
 */
import { Page } from 'puppeteer-core';
export interface EvalOptions {
    url?: string;
    json?: boolean;
}
export declare function evalJs(page: Page, code: string, options?: EvalOptions): Promise<void>;
//# sourceMappingURL=eval.d.ts.map