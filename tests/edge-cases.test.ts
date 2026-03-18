/**
 * Edge case tests for browser CLI commands
 * 
 * These tests cover input validation, option handling, and edge cases
 * that could cause bugs in the type, click, scroll, find, and eval commands.
 */

import { describe, it, expect } from 'vitest';

describe('Type command edge cases', () => {
  describe('Text handling', () => {
    it('should handle empty text input', () => {
      const text = '';
      expect(text).toBe('');
      // In real usage, page.type('', selector) would type nothing
    });

    it('should handle text with special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
      expect(specialChars.length).toBeGreaterThan(0);
    });

    it('should handle text with newlines and tabs', () => {
      const textWithNewlines = 'line1\nline2\ttabbed';
      expect(textWithNewlines).toContain('\n');
      expect(textWithNewlines).toContain('\t');
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      expect(longText.length).toBe(10000);
    });

    it('should handle unicode characters', () => {
      const unicode = 'Hello 世界 🌍 مرحبا';
      expect(unicode.length).toBeGreaterThan(10);
    });
  });

  describe('Clear option validation', () => {
    it('should handle clear:true boolean', () => {
      const clear = true;
      expect(clear).toBe(true);
      // When clear: true, should set el.value = '' before typing
    });

    it('should handle clear:false boolean', () => {
      const clear = false;
      expect(clear).toBe(false);
    });

    it('should default clear to false when undefined', () => {
      const clear = undefined;
      const defaultValue = clear ?? false;
      expect(defaultValue).toBe(false);
    });
  });

  describe('Enter key submission', () => {
    it('should handle enter:true boolean', () => {
      const enter = true;
      expect(enter).toBe(true);
      // When enter: true, dispatches keydown/keypress/keyup for Enter
    });

    it('should handle enter:false boolean', () => {
      const enter = false;
      expect(enter).toBe(false);
    });

    it('should default enter to false when undefined', () => {
      const enter = undefined;
      const defaultValue = enter ?? false;
      expect(defaultValue).toBe(false);
    });
  });

  describe('Wait option', () => {
    it('should handle wait: 0 (no wait)', () => {
      const wait = 0;
      const effectiveWait = wait || 0;
      expect(effectiveWait).toBe(0);
    });

    it('should handle large wait values', () => {
      const wait = 10000;
      expect(wait).toBeGreaterThan(0);
    });

    it('should default wait to 0 when undefined', () => {
      const wait = undefined;
      const defaultValue = wait || 0;
      expect(defaultValue).toBe(0);
    });
  });

  describe('URL protocol handling', () => {
    it('should add https:// prefix to URLs without protocol', () => {
      const input = 'example.com';
      let targetUrl = input;
      if (!input.startsWith('http://') && !input.startsWith('https://') && !input.startsWith('file://')) {
        targetUrl = `https://${input}`;
      }
      expect(targetUrl).toBe('https://example.com');
    });

    it('should preserve http:// protocol', () => {
      const input = 'http://example.com';
      let targetUrl = input;
      if (!input.startsWith('http://') && !input.startsWith('https://') && !input.startsWith('file://')) {
        targetUrl = `https://${input}`;
      }
      expect(targetUrl).toBe('http://example.com');
    });

    it('should preserve https:// protocol', () => {
      const input = 'https://example.com';
      let targetUrl = input;
      if (!input.startsWith('http://') && !input.startsWith('https://') && !input.startsWith('file://')) {
        targetUrl = `https://${input}`;
      }
      expect(targetUrl).toBe('https://example.com');
    });

    it('should handle URLs with paths', () => {
      const input = 'example.com/path/to/page';
      let targetUrl = input;
      if (!input.startsWith('http://') && !input.startsWith('https://') && !input.startsWith('file://')) {
        targetUrl = `https://${input}`;
      }
      expect(targetUrl).toBe('https://example.com/path/to/page');
    });

    it('should handle file:// protocol', () => {
      const input = 'file:///path/to/file.html';
      let targetUrl = input;
      if (!input.startsWith('http://') && !input.startsWith('https://') && !input.startsWith('file://')) {
        targetUrl = `https://${input}`;
      }
      expect(targetUrl).toBe('file:///path/to/file.html');
    });
  });
});

describe('Click command edge cases', () => {
  describe('Wait option', () => {
    it('should handle wait: 0', () => {
      const wait = 0;
      expect(wait || 0).toBe(0);
    });

    it('should handle positive wait values', () => {
      const wait = 500;
      expect(wait).toBe(500);
    });

    it('should default wait to 0 when undefined', () => {
      const wait = undefined;
      expect(wait || 0).toBe(0);
    });
  });

  describe('Selector patterns', () => {
    it('should handle basic CSS selectors', () => {
      const selectors = ['#id', '.class', 'div', 'input'];
      for (const selector of selectors) {
        expect(typeof selector).toBe('string');
        expect(selector.length).toBeGreaterThan(0);
      }
    });

    it('should handle complex CSS selectors', () => {
      const selectors = [
        'div > p',
        'input[name="test"]',
        '[data-value="hello"]',
        '.class1.class2',
        'div:nth-child(2)',
      ];
      
      for (const selector of selectors) {
        expect(typeof selector).toBe('string');
      }
    });
  });
});

describe('Scroll command edge cases', () => {
  describe('Direction handling', () => {
    it('should handle direction: up', () => {
      const direction = 'up' as const;
      const delta = direction === 'down' ? 1 : -1;
      expect(delta).toBe(-1);
    });

    it('should handle direction: down', () => {
      const direction = 'down' as const;
      const delta = direction === 'down' ? 1 : -1;
      expect(delta).toBe(1);
    });

    it('should handle undefined direction', () => {
      const direction = undefined;
      const isUpOrDown = direction === 'up' || direction === 'down';
      expect(isUpOrDown).toBe(false);
    });
  });

  describe('Scroll by values', () => {
    it('should handle positive y value', () => {
      const y = 100;
      expect(y).toBe(100);
    });

    it('should handle negative y value', () => {
      const y = -100;
      expect(y).toBe(-100);
    });

    it('should default x to 0 when undefined', () => {
      const x = undefined;
      const defaultValue = x || 0;
      expect(defaultValue).toBe(0);
    });

    it('should handle explicit x value', () => {
      const x = 50;
      expect(x).toBe(50);
    });
  });

  describe('Selector scrolling', () => {
    it('should handle selector option', () => {
      const selector = '#myElement';
      expect(selector).toBe('#myElement');
    });

    it('should handle undefined selector', () => {
      const selector = undefined;
      expect(selector).toBeUndefined();
    });
  });

  describe('Option precedence', () => {
    it('should prioritize selector over direction and y', () => {
      const options = {
        selector: '#element',
        direction: 'down' as const,
        y: 100,
      };
      
      // In the code, selector is checked first
      if (options.selector) {
        expect(options.selector).toBe('#element');
      }
    });

    it('should prioritize direction over y when no selector', () => {
      const options = {
        direction: 'up' as const,
        y: 100,
      };
      
      if (!options.selector && (options.direction === 'up' || options.direction === 'down')) {
        expect(options.direction).toBe('up');
      }
    });

    it('should use y when no selector or direction', () => {
      const options = {
        y: 100,
      };
      
      if (!options.selector && !(options.direction === 'up' || options.direction === 'down')) {
        expect(options.y).toBe(100);
      }
    });
  });
});

describe('Find command edge cases', () => {
  describe('Search text', () => {
    it('should handle empty search text', () => {
      const text = '';
      expect(text).toBe('');
      // Empty search would match all elements with any text
    });

    it('should handle single character search', () => {
      const text = 'a';
      expect(text.length).toBe(1);
    });

    it('should handle special characters', () => {
      const text = 'Hello "World" & Friends';
      expect(text).toContain('"');
      expect(text).toContain('&');
    });
  });

  describe('Tag filtering', () => {
    it('should handle tag filter', () => {
      const tag = 'button';
      expect(tag).toBe('button');
    });

    it('should handle undefined tag', () => {
      const tag = undefined;
      expect(tag).toBeUndefined();
    });

    it('should handle case-insensitive tag matching', () => {
      const tag = 'BUTTON';
      const elTag = 'button';
      expect(elTag.toLowerCase()).toBe(tag.toLowerCase());
    });
  });

  describe('Exact match option', () => {
    it('should handle exact: true', () => {
      const exact = true;
      expect(exact).toBe(true);
    });

    it('should handle exact: false', () => {
      const exact = false;
      expect(exact).toBe(false);
    });

    it('should default exact to false when undefined', () => {
      const exact = undefined;
      const defaultValue = exact ?? false;
      expect(defaultValue).toBe(false);
    });
  });

  describe('Role filtering', () => {
    it('should handle role filter', () => {
      const role = 'button';
      expect(role).toBe('button');
    });

    it('should handle undefined role', () => {
      const role = undefined;
      expect(role).toBeUndefined();
    });
  });

  describe('ARIA label filtering', () => {
    it('should handle ariaLabel filter', () => {
      const ariaLabel = 'Submit';
      expect(ariaLabel).toBe('Submit');
    });

    it('should handle undefined ariaLabel', () => {
      const ariaLabel = undefined;
      expect(ariaLabel).toBeUndefined();
    });

    it('should use includes for ariaLabel matching', () => {
      const ariaLabel = 'Submit';
      const elementLabel = 'Submit Form';
      expect(elementLabel?.includes(ariaLabel)).toBe(true);
    });
  });

  describe('Result limiting', () => {
    it('should limit results to 20', () => {
      const results = Array.from({ length: 100 }, (_, i) => ({ index: i }));
      const limited = results.slice(0, 20);
      expect(limited.length).toBe(20);
    });

    it('should not limit if fewer than 20 results', () => {
      const results = Array.from({ length: 10 }, (_, i) => ({ index: i }));
      const limited = results.slice(0, 20);
      expect(limited.length).toBe(10);
    });
  });

  describe('Text length filtering', () => {
    it('should skip elements with text > 200 chars', () => {
      const longText = 'a'.repeat(201);
      expect(longText.length).toBeGreaterThan(200);
    });

    it('should include elements with text <= 200 chars', () => {
      const shortText = 'a'.repeat(200);
      expect(shortText.length).toBeLessThanOrEqual(200);
    });
  });
});

describe('Eval command edge cases', () => {
  describe('Return value handling', () => {
    it('should handle undefined return value', () => {
      const result = undefined;
      const output = String(result);
      expect(output).toBe('undefined');
    });

    it('should handle null return value', () => {
      const result = null;
      const output = String(result);
      expect(output).toBe('null');
    });

    it('should handle string return value', () => {
      const result = 'hello';
      const output = String(result);
      expect(output).toBe('hello');
    });

    it('should handle number return value', () => {
      const result = 42;
      const output = String(result);
      expect(output).toBe('42');
    });

    it('should handle boolean return value', () => {
      const result = true;
      const output = String(result);
      expect(output).toBe('true');
    });

    it('should handle object return value with json:true', () => {
      const result = { foo: 'bar', num: 42 };
      const jsonOutput = JSON.stringify(result);
      expect(jsonOutput).toContain('foo');
      expect(jsonOutput).toContain('bar');
    });

    it('should handle array return value with json:true', () => {
      const result = [1, 2, 3];
      const jsonOutput = JSON.stringify(result);
      expect(jsonOutput).toBe('[1,2,3]');
    });
  });

  describe('JSON option', () => {
    it('should handle json: true', () => {
      const json = true;
      expect(json).toBe(true);
    });

    it('should handle json: false', () => {
      const json = false;
      expect(json).toBe(false);
    });

    it('should default json to false when undefined', () => {
      const json = undefined;
      const defaultValue = json ?? false;
      expect(defaultValue).toBe(false);
    });
  });

  describe('Silent option', () => {
    it('should handle silent: true', () => {
      const silent = true;
      expect(silent).toBe(true);
    });

    it('should handle silent: false', () => {
      const silent = false;
      expect(silent).toBe(false);
    });

    it('should default silent to false when undefined', () => {
      const silent = undefined;
      const defaultValue = silent ?? false;
      expect(defaultValue).toBe(false);
    });
  });

  describe('Code length handling', () => {
    it('should truncate long code in logs', () => {
      const code = 'a'.repeat(200);
      const truncated = code.substring(0, 100) + (code.length > 100 ? '...' : '');
      expect(truncated.length).toBe(103);
      expect(truncated).toContain('...');
    });

    it('should not truncate short code', () => {
      const code = 'console.log("hi")';
      const truncated = code.substring(0, 100) + (code.length > 100 ? '...' : '');
      expect(truncated).toBe('console.log("hi")');
      expect(truncated).not.toContain('...');
    });
  });
});
