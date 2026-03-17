/**
 * Session Manager - Browser session lifecycle management
 *
 * Handles browser launch, connection, and tab attachment.
 * Uses Puppeteer for native Chrome DevTools Protocol support.
 */
import { Browser, Page } from 'puppeteer-core';
export interface SessionOptions {
    headless?: boolean;
    slowMo?: number;
    port?: number;
    ws?: string;
    tabId?: string;
    timeout?: number;
}
export interface Session {
    browser: Browser;
    page: Page;
    tabId?: string;
    options: SessionOptions;
    close: () => Promise<void>;
}
/**
 * Create a new browser session
 */
export declare function createSession(options?: SessionOptions): Promise<Session>;
//# sourceMappingURL=session.d.ts.map