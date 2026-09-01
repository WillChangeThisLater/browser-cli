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
import { withTimeout } from './timeout';

export interface TargetSpec {
  original: string;
  kind: 'css' | 'text' | 'aria';
  value: string;
  exact: boolean;
}

export function parseTarget(target: string, exact = false): TargetSpec {
  if (target.startsWith('text:')) return { original: target, kind: 'text', value: target.slice(5), exact };
  if (target.startsWith('aria:')) return { original: target, kind: 'aria', value: target.slice(5), exact };
  if (target.startsWith('css:')) return { original: target, kind: 'css', value: target.slice(4), exact };
  // Heuristic: bare strings with spaces or without selector punctuation are
  // more likely human text than a CSS selector.
  if (!/^[\w#.\[\]:>~*=@^|$()-]+$/.test(target)) {
    return { original: target, kind: 'text', value: target, exact };
  }
  return { original: target, kind: 'css', value: target, exact };
}

export interface Rect { x: number; y: number; width: number; height: number; }

export interface ResolvedTarget {
  spec: TargetSpec;
  matched: { tag: string; text: string; visible: boolean };
  hitTarget: { tag: string; via: 'self' | 'ancestor'; level: number; text: string };
  rect: Rect;
  center: { x: number; y: number };
  url: string;
  title: string;
}

interface RawResolution {
  matchedTag: string;
  matchedText: string;
  matchedVisible: boolean;
  hitTag: string;
  hitLevel: number;
  hitText: string;
  rect: Rect;
  candidateCount: number;
}

export async function resolveTarget(
  page: Page,
  target: string,
  options: { exact?: boolean; timeout?: number } = {}
): Promise<ResolvedTarget> {
  const spec = parseTarget(target, options.exact ?? false);
  const timeout = options.timeout || 30000;
  const startTime = Date.now();

  // Wait for *something* to exist, then resolve.
  const raw = await withTimeout((async (): Promise<RawResolution | null> => {
    const deadline = Date.now() + timeout;
    for (;;) {
      const r: RawResolution | null = await page.evaluate((s: TargetSpec) => {
        const isVisible = (el: Element): boolean => {
          const rects = el.getClientRects();
          if (rects.length === 0) return false;
          const st = getComputedStyle(el);
          if (st.visibility === 'hidden' || st.display === 'none') return false;
          const rect = el.getBoundingClientRect();
          return rect.width >= 2 && rect.height >= 2;
        };

        let candidates: Element[] = [];
        try {
          if (s.kind === 'css') {
            candidates = Array.from(document.querySelectorAll(s.value));
          } else if (s.kind === 'aria') {
            candidates = Array.from(document.querySelectorAll('[aria-label]')).filter(el =>
              s.exact
                ? el.getAttribute('aria-label') === s.value
                : (el.getAttribute('aria-label') || '').toLowerCase().includes(s.value.toLowerCase())
            );
          } else {
            const want = s.value.toLowerCase();
            const all = Array.from(document.querySelectorAll('button, a, input, select, label, [role=button], [role=checkbox], [role=tab], summary, li, div, span'));
            candidates = all.filter(el => {
              if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) return false;
              const t = ((el as HTMLElement).innerText || el.textContent || '').trim();
              if (!t || t.length > 200) return false;
              return s.exact ? t.toLowerCase() === want : t.toLowerCase().includes(want);
            });
          }
        } catch {
          return null; // invalid selector
        }

        if (candidates.length === 0) return null;

        // Prefer visible candidates; among ties prefer smallest (deepest) match.
        const scored = candidates.map(el => {
          const rect = el.getBoundingClientRect();
          return { el, visible: isVisible(el), area: rect.width * rect.height };
        });
        scored.sort((a, b) => (a.visible === b.visible) ? a.area - b.area : (a.visible ? -1 : 1));

        for (const { el } of scored) {
          // Find the real hit target: self or nearest visible ancestor (max 5 up).
          let node: Element | null = el;
          let level = 0;
          while (node && level <= 5) {
            if (isVisible(node)) {
              const hitRect = node.getBoundingClientRect();
              if (hitRect.width >= 2 && hitRect.height >= 2) {
                const anyRect = el.getBoundingClientRect();
                return {
                  matchedTag: el.tagName.toLowerCase(),
                  matchedText: ((el as HTMLElement).innerText || el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 120),
                  matchedVisible: isVisible(el),
                  hitTag: node.tagName.toLowerCase(),
                  hitLevel: level,
                  hitText: ((node as HTMLElement).innerText || node.getAttribute('aria-label') || '').trim().slice(0, 120),
                  rect: {
                    x: Math.round(hitRect.x),
                    y: Math.round(hitRect.y),
                    width: Math.round(hitRect.width),
                    height: Math.round(hitRect.height),
                  },
                  candidateCount: candidates.length,
                };
              }
            }
            node = node.parentElement;
            level++;
          }
        }
        return null; // candidates exist but nothing visible
      }, spec);

      if (r !== null) return r;
      if (Date.now() + 250 > deadline) return null;
      await new Promise(res => setTimeout(res, 250));
    }
  })(), timeout + 5000, 'Target resolution');

  if (!raw) {
    throw new Error(
      `Could not resolve a visible click target for "${target}" ` +
      `(kind=${spec.kind}). If it's a text match, verify with 'browser find "${spec.value}"'.`
    );
  }

  // Scroll the hit target into view and recompute coordinates (rect may shift).
  await page.evaluate((r: RawResolution) => {
    // Re-find by walking from the matched rect is fragile; simplest robust
    // approach: elementFromPoint at the center we computed.
    const cx = r.rect.x + r.rect.width / 2;
    const cy = r.rect.y + r.rect.height / 2;
    const el = document.elementFromPoint(cx, cy);
    if (el) (el.closest('[role=dialog]') || el).scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
  }, raw);
  await new Promise(res => setTimeout(res, 150));

  const rect: Rect = await page.evaluate((r: RawResolution) => {
    const cx0 = r.rect.x + r.rect.width / 2;
    const cy0 = r.rect.y + r.rect.height / 2;
    const near = document.elementFromPoint(cx0, cy0);
    let node: Element | null = near;
    for (let i = 0; node && i <= r.hitLevel; i++) node = node.parentElement;
    const target = (node && node !== document.body ? node : near) || near;
    const rect = target ? target.getBoundingClientRect() : { x: 0, y: 0, width: 0, height: 0 };
    return {
      x: Math.round(rect.x), y: Math.round(rect.y),
      width: Math.round(rect.width), height: Math.round(rect.height),
    };
  }, raw);

  const pageUrl = page.url();
  const title = await page.evaluate(() => document.title);

  return {
    spec,
    matched: { tag: raw.matchedTag, text: raw.matchedText, visible: raw.matchedVisible },
    hitTarget: { tag: raw.hitTag, via: raw.hitLevel === 0 ? 'self' : 'ancestor', level: raw.hitLevel, text: raw.hitText },
    rect,
    center: { x: rect.x + Math.floor(rect.width / 2), y: rect.y + Math.floor(rect.height / 2) },
    url: pageUrl,
    title,
  };
}
