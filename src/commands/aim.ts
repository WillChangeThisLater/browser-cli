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
import { withTimeout } from '../utils/timeout';
import { CliError } from '../utils/cli';
import * as fs from 'fs';
import * as path from 'path';
import { resolveTarget } from '../utils/target';

export interface AimOptions {
  url?: string;
  timeout?: number;
  exact?: boolean;
  fullPage?: boolean;
  type?: 'png' | 'jpeg';
  quality?: number;
}

const MARKER_ID = '__browser_aim_marker__';

export async function aim(page: Page, target: string, outputPath: string, options: AimOptions = {}): Promise<void> {
  const timeout = options.timeout || 120000;
  const startTime = Date.now();

  if (options.url) {
    console.error(`[aim] Navigating to ${options.url} first`);
    let targetUrl = options.url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('file://')) {
      targetUrl = `https://${targetUrl}`;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout });
  }

  console.error(`[aim] Aiming at target: ${target}`);

  try {
    const operationPromise = (async () => {
      const resolved = await resolveTarget(page, target, { exact: options.exact, timeout });

      // Inject crosshair marker at the resolved click point.
      await page.evaluate((p: { id: string; x: number; y: number }) => {
        document.getElementById(p.id)?.remove();
        const m = document.createElement('div');
        m.id = p.id;
        const size = 22;
        m.style.cssText = [
          `position:fixed`,
          `left:${p.x - size / 2}px`,
          `top:${p.y - size / 2}px`,
          `width:${size}px`,
          `height:${size}px`,
          `border:2px solid #ff2020`,
          `border-radius:50%`,
          `box-shadow:0 0 0 1px rgba(255,255,255,.9), inset 0 0 0 1px rgba(255,255,255,.9)`,
          `z-index:2147483647`,
          `pointer-events:none`,
        ].join(';');
        const dot = document.createElement('div');
        dot.style.cssText = `position:absolute;left:50%;top:50%;width:3px;height:3px;margin:-1.5px;background:#ff2020;border-radius:50%`;
        m.appendChild(dot);
        document.body.appendChild(m);
      }, { id: MARKER_ID, x: resolved.center.x, y: resolved.center.y });

      console.error(`[aim] Marker injected at (${resolved.center.x}, ${resolved.center.y}); capturing screenshot`);

      const type = options.type || 'png';
      const quality = options.quality ? parseInt(options.quality.toString()) : 80;
      const outDir = path.dirname(outputPath);
      if (outDir && outDir !== '.' && !fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      await page.screenshot({
        path: outputPath,
        type,
        quality: type === 'jpeg' ? quality : undefined,
        fullPage: options.fullPage ?? false,
      });

      // Remove marker.
      await page.evaluate((id: string) => { document.getElementById(id)?.remove(); }, MARKER_ID);

      const client = await page.target().createCDPSession();
      const { targetInfo } = await client.send('Target.getTargetInfo');
      const tabId = targetInfo.targetId;
      await client.detach();

      return { tabId, resolved };
    })();

    const result = await withTimeout(operationPromise, timeout + 5000, 'Aim operation');

    const elapsed = Date.now() - startTime;
    console.error(`[aim] Screenshot saved to ${outputPath} (${elapsed}ms)`);

    console.log(JSON.stringify({
      success: true,
      tabId: result.tabId,
      target,
      resolved: {
        matched: result.resolved.matched,
        hitTarget: result.resolved.hitTarget,
        rect: result.resolved.rect,
        center: result.resolved.center,
      },
      screenshot: outputPath,
      url: result.resolved.url,
      title: result.resolved.title,
    }));
  } catch (error: any) {
    // Best-effort marker cleanup.
    try { await page.evaluate((id: string) => { document.getElementById(id)?.remove(); }, MARKER_ID); } catch {}
    const elapsed = Date.now() - startTime;
    console.error(`[aim] Failed after ${elapsed}ms: ${error.message}`);
    throw new CliError({
      success: false,
      error: error.message,
      target,
      elapsed
    }, 2);
  }
}
