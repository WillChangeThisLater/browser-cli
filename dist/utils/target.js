"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTarget = parseTarget;
exports.resolveTarget = resolveTarget;
const timeout_1 = require("./timeout");
function parseTarget(target, exact = false) {
    if (target.startsWith('text:'))
        return { original: target, kind: 'text', value: target.slice(5), exact };
    if (target.startsWith('aria:'))
        return { original: target, kind: 'aria', value: target.slice(5), exact };
    if (target.startsWith('css:'))
        return { original: target, kind: 'css', value: target.slice(4), exact };
    // Puppeteer-style :has-text() — possibly comma-separated alternatives.
    if (target.includes(':has-text(')) {
        const alternatives = [];
        for (const part of splitTopLevel(target, ',')) {
            const m = part.trim().match(/^(.*):has-text\((['"])([\s\S]*)\2\)\s*$/);
            if (m)
                alternatives.push({ css: m[1].trim(), text: m[3] });
        }
        if (alternatives.length > 0) {
            return { original: target, kind: 'hastext', value: target, exact, alternatives };
        }
    }
    // Heuristic: bare strings with spaces or without selector punctuation are
    // more likely human text than a CSS selector.
    if (!/^[\w#.\[\]:>~*=@^|$()-]+$/.test(target)) {
        return { original: target, kind: 'text', value: target, exact };
    }
    return { original: target, kind: 'css', value: target, exact };
}
/** Split on a delimiter, ignoring delimiters inside quotes or parentheses. */
function splitTopLevel(s, delim) {
    const parts = [];
    let depth = 0, quote = null, cur = '';
    for (const ch of s) {
        if (quote) {
            cur += ch;
            if (ch === quote)
                quote = null;
            continue;
        }
        if (ch === '"' || ch === "'") {
            quote = ch;
            cur += ch;
            continue;
        }
        if (ch === '(' || ch === '[')
            depth++;
        if (ch === ')' || ch === ']')
            depth--;
        if (ch === delim && depth === 0) {
            parts.push(cur);
            cur = '';
            continue;
        }
        cur += ch;
    }
    if (cur.trim())
        parts.push(cur);
    return parts;
}
async function resolveTarget(page, target, options = {}) {
    const spec = parseTarget(target, options.exact ?? false);
    const timeout = options.timeout || 30000;
    const startTime = Date.now();
    // Wait for *something* to exist, then resolve. Invalid selectors fail fast
    // (with a text fallback for Puppeteer-style selectors that aren't valid CSS).
    let spec2 = spec;
    const raw = await (0, timeout_1.withTimeout)((async () => {
        const deadline = Date.now() + timeout;
        for (;;) {
            const r = await page.evaluate((s) => {
                const isVisible = (el) => {
                    const rects = el.getClientRects();
                    if (rects.length === 0)
                        return false;
                    const st = getComputedStyle(el);
                    if (st.visibility === 'hidden' || st.display === 'none')
                        return false;
                    const rect = el.getBoundingClientRect();
                    return rect.width >= 2 && rect.height >= 2;
                };
                const safeQuery = (sel) => {
                    try {
                        return Array.from(document.querySelectorAll(sel));
                    }
                    catch {
                        return null;
                    }
                };
                const textMatches = (el) => {
                    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName))
                        return false;
                    const t = (el.innerText || el.textContent || '').trim();
                    if (!t || t.length > 200)
                        return false;
                    const want = s.value.toLowerCase();
                    return s.exact ? t.toLowerCase() === want : t.toLowerCase().includes(want);
                };
                let candidates = [];
                if (s.kind === 'css') {
                    const found = safeQuery(s.value);
                    if (found === null)
                        return { invalid: true, raw: null };
                    candidates = found;
                }
                else if (s.kind === 'aria') {
                    candidates = Array.from(document.querySelectorAll('[aria-label]')).filter(el => s.exact
                        ? el.getAttribute('aria-label') === s.value
                        : (el.getAttribute('aria-label') || '').toLowerCase().includes(s.value.toLowerCase()));
                }
                else if (s.kind === 'hastext') {
                    // Puppeteer-style: `button:has-text('X'), a:has-text('Y')` — try each
                    // alternative; if the css part is invalid, match text on all interactive
                    // elements instead.
                    for (const alt of s.alternatives || []) {
                        const base = safeQuery(alt.css || '*');
                        if (base === null)
                            continue;
                        const want = alt.text.toLowerCase();
                        candidates = base.filter(el => {
                            const t = (el.innerText || el.textContent || '').trim();
                            if (!t || t.length > 200)
                                return false;
                            return s.exact ? t.toLowerCase() === want : t.toLowerCase().includes(want);
                        });
                        if (candidates.length > 0)
                            break;
                    }
                    if (candidates.length === 0) {
                        candidates = Array.from(document.querySelectorAll('button, a, [role=button]')).filter(textMatches);
                    }
                }
                else {
                    const all = Array.from(document.querySelectorAll('button, a, input, select, label, [role=button], [role=checkbox], [role=tab], summary, li, div, span'));
                    candidates = all.filter(textMatches);
                }
                if (candidates.length === 0)
                    return { raw: null };
                // Prefer visible candidates; among ties prefer smallest (deepest) match.
                const scored = candidates.map(el => {
                    const rect = el.getBoundingClientRect();
                    return { el, visible: isVisible(el), area: rect.width * rect.height };
                });
                scored.sort((a, b) => (a.visible === b.visible) ? a.area - b.area : (a.visible ? -1 : 1));
                for (const { el } of scored) {
                    // Find the real hit target: self or nearest visible ancestor (max 5 up).
                    let node = el;
                    let level = 0;
                    while (node && level <= 5) {
                        if (isVisible(node)) {
                            const hitRect = node.getBoundingClientRect();
                            if (hitRect.width >= 2 && hitRect.height >= 2) {
                                const anyRect = el.getBoundingClientRect();
                                return { raw: {
                                        matchedTag: el.tagName.toLowerCase(),
                                        matchedText: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 120),
                                        matchedVisible: isVisible(el),
                                        hitTag: node.tagName.toLowerCase(),
                                        hitLevel: level,
                                        hitText: (node.innerText || node.getAttribute('aria-label') || '').trim().slice(0, 120),
                                        rect: {
                                            x: Math.round(hitRect.x),
                                            y: Math.round(hitRect.y),
                                            width: Math.round(hitRect.width),
                                            height: Math.round(hitRect.height),
                                        },
                                        candidateCount: candidates.length,
                                    } };
                            }
                        }
                        node = node.parentElement;
                        level++;
                    }
                }
                return { raw: null }; // candidates exist but nothing visible
            }, spec2);
            if (r.invalid) {
                // Invalid CSS — one retry as a plain text match, else fail fast.
                if (spec2.kind === 'css' && !spec2.original.startsWith('css:')) {
                    spec2 = { ...spec2, kind: 'text', value: spec2.original };
                    continue;
                }
                throw new Error(`Invalid selector: "${spec2.value}"`);
            }
            if (r.raw !== null)
                return r.raw;
            if (Date.now() + 250 > deadline)
                return null;
            await new Promise(res => setTimeout(res, 250));
        }
    })(), timeout + 5000, 'Target resolution');
    if (!raw) {
        throw new Error(`Could not resolve a visible click target for "${target}" ` +
            `(kind=${spec2.kind}). If it's a text match, verify with 'browser find "${spec2.value}"'.`);
    }
    // Scroll the hit target into view and recompute coordinates (rect may shift).
    await page.evaluate((r) => {
        // Re-find by walking from the matched rect is fragile; simplest robust
        // approach: elementFromPoint at the center we computed.
        const cx = r.rect.x + r.rect.width / 2;
        const cy = r.rect.y + r.rect.height / 2;
        const el = document.elementFromPoint(cx, cy);
        if (el)
            (el.closest('[role=dialog]') || el).scrollIntoView({ block: 'center', behavior: 'instant' });
    }, raw);
    await new Promise(res => setTimeout(res, 150));
    const rect = await page.evaluate((r) => {
        const cx0 = r.rect.x + r.rect.width / 2;
        const cy0 = r.rect.y + r.rect.height / 2;
        const near = document.elementFromPoint(cx0, cy0);
        let node = near;
        for (let i = 0; node && i <= r.hitLevel; i++)
            node = node.parentElement;
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
//# sourceMappingURL=target.js.map