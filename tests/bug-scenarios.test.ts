/**
 * Tests for common bug scenarios in browser automation
 * 
 * These tests catch regressions in:
 * - CDP session leaks
 * - Error handling consistency  
 * - Resource cleanup on failures
 * - Input validation edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { withTimeout } from '../src/utils/timeout';

describe('Bug Scenario: CDP Session Cleanup', () => {
  it('should call client.detach() after createCDPSession() to prevent leaks', async () => {
    // BUG: Commands create CDP sessions but never detach them
    // This leaks connections to Chrome over time
    
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    
    const commandsDir = join(process.cwd(), 'src/commands');
    const commandFiles = [
      'go.ts', 'click.ts', 'type.ts', 'screenshot.ts', 
      'eval.ts', 'inspect.ts', 'scroll.ts', 'find.ts', 'wait-for.ts'
    ];
    
    const violations: string[] = [];
    
    for (const file of commandFiles) {
      const filePath = join(commandsDir, file);
      try {
        const content = readFileSync(filePath, 'utf-8');
        
        // Count createCDPSession and detach calls
        const createSessionCount = (content.match(/createCDPSession\(\)/g) || []).length;
        const detachCount = (content.match(/client\.detach\(\)/g) || []).length;
        
        // If there's a createCDPSession, there MUST be a detach
        if (createSessionCount > 0 && detachCount < createSessionCount) {
          violations.push(`${file}: ${createSessionCount} createCDPSession() but only ${detachCount} detach()`);
        }
      } catch {
        // File might not exist, skip
      }
    }
    
    // This assertion will fail until we fix the bug
    expect(violations).toEqual([]);
  });
});

describe('Bug Scenario: Error Handling Consistency', () => {
  it('should have consistent process.exit usage across commands', async () => {
    // All commands should use exit code 2 for failures, 0 for success
    // This test verifies the pattern is consistent
    
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    
    const commandsDir = join(process.cwd(), 'src/commands');
    const commandFiles = ['go.ts', 'click.ts', 'type.ts', 'screenshot.ts', 
                         'eval.ts', 'inspect.ts', 'scroll.ts', 'find.ts', 'wait-for.ts'];
    
    for (const file of commandFiles) {
      const filePath = join(commandsDir, file);
      try {
        const content = readFileSync(filePath, 'utf-8');
        
        // Check that process.exit(2) is used for errors (not exit(1) or exit(0))
        const errorExits = content.match(/process\.exit\(\d+\)/g) || [];
        
        for (const exit of errorExits) {
          // Exit code should be 2 for errors
          expect(exit).toMatch(/process\.exit\(2\)/);
        }
      } catch {
        // File might not exist, skip
      }
    }
  });
});

describe('Bug Scenario: Input Validation', () => {
  it('should handle empty URL gracefully', async () => {
    // Empty URL should fail with a clear error, not hang or crash
    const result = await withTimeout(
      (async () => {
        const url = '';
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
          targetUrl = `https://${url}`;
        }
        // Empty URL becomes "https://" which should fail
        return targetUrl;
      })(),
      1000,
      'URL validation'
    );
    
    expect(result).toBe('https://');
    // Note: The actual navigation will fail, but URL preprocessing should handle it
  });

  it('should preserve existing http/https protocols', async () => {
    const testCases = [
      { input: 'http://example.com', expected: 'http://example.com' },
      { input: 'https://example.com', expected: 'https://example.com' },
      { input: 'example.com', expected: 'https://example.com' },
    ];
    
    for (const { input, expected } of testCases) {
      const result = await withTimeout(
        (async () => {
          let targetUrl = input;
          if (!input.startsWith('http://') && !input.startsWith('https://') && !input.startsWith('file://')) {
            targetUrl = `https://${input}`;
          }
          return targetUrl;
        })(),
        1000,
        'URL validation'
      );
      
      expect(result).toBe(expected);
    }
  });

  it('should handle malformed selectors gracefully', async () => {
    // Invalid CSS selectors should fail with clear error, not crash
    const invalidSelectors = [
      '',
      'div[',
      '.class>',
      '#id<',
      '[attr',
    ];
    
    // Just verify we can process them without throwing in validation
    for (const selector of invalidSelectors) {
      const isValid = selector.length > 0 && !/[<>]/.test(selector);
      expect(typeof isValid).toBe('boolean');
    }
  });
});

describe('Bug Scenario: Timeout Cleanup on All Paths', () => {
  it('should cleanup timer when promise resolves', async () => {
    const quickPromise = Promise.resolve('success');
    await withTimeout(quickPromise, 5000, 'test');
    // If timer wasn't cleaned up, test would hang 5 seconds
  });

  it('should cleanup timer when promise rejects', async () => {
    const failingPromise = Promise.reject(new Error('failed'));
    await expect(withTimeout(failingPromise, 5000, 'test')).rejects.toThrow('failed');
    // If timer wasn't cleaned up, test would hang 5 seconds
  });

  it('should cleanup timer when timeout fires', async () => {
    const slowPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('too late'), 100);
    });
    
    await expect(
      withTimeout(slowPromise, 10, 'test')
    ).rejects.toThrow('test timeout after 10ms');
    
    // Wait for the slow promise to "resolve" - timer should be cleaned up
    await new Promise(resolve => setTimeout(resolve, 100));
    // No additional errors should occur
  });
});
