/**
 * aim command - Visualize where a click would land, WITHOUT clicking.
 *
 * Resolves a target (same resolution as `click`: css/text/aria, with
 * hidden-element hit-target walk-up), injects a temporary crosshair
 * marker into the live DOM at the resolved click point, captures a
 * screenshot, then removes the marker. The agent can read the screenshot
 * to confirm the coordinates before attempting any real click — and the
 * printed rect/center doubles as the coordinate source for X11-level
 * automation (xdotool), avoiding eyeballed pixel guesses.
 */
import { Page } from 'puppeteer-core';
export interface AimOptions {
    url?: string;
    timeout?: number;
    exact?: boolean;
    fullPage?: boolean;
    type?: 'png' | 'jpeg';
    quality?: number;
}
export declare function aim(page: Page, target: string, outputPath: string, options?: AimOptions): Promise<void>;
//# sourceMappingURL=aim.d.ts.map