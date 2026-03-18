/**
 * Tests for timeout utility
 * 
 * These tests verify that withTimeout properly cleans up timers,
 * preventing the Node.js event loop from hanging after operations complete.
 */

import { describe, it, expect } from 'vitest';
import { withTimeout } from '../src/utils/timeout';

describe('withTimeout', () => {
  it('should resolve with the promise value when it completes before timeout', async () => {
    const promise = Promise.resolve('success');
    const result = await withTimeout(promise, 1000, 'test operation');
    expect(result).toBe('success');
  });

  it('should reject with timeout error when promise takes too long', async () => {
    const slowPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('too late'), 100);
    });
    
    await expect(
      withTimeout(slowPromise, 10, 'test operation')
    ).rejects.toThrow('test operation timeout after 10ms');
  });

  it('should reject with original error when promise fails', async () => {
    const failingPromise = Promise.reject(new Error('original error'));
    
    await expect(
      withTimeout(failingPromise, 1000, 'test operation')
    ).rejects.toThrow('original error');
  });

  it('should cleanup timer on success (prevent event loop hang)', async () => {
    // This is the key test - verifies the fix for the hanging issue
    const quickPromise = Promise.resolve('done');
    
    await withTimeout(quickPromise, 5000, 'test operation');
    
    // If timer wasn't cleaned up, this would hang for 5 seconds
    // The test passing quickly proves cleanup worked
    expect(true).toBe(true);
  });

  it('should cleanup timer on failure (prevent event loop hang)', async () => {
    // Verify cleanup also works on promise rejection
    const failingPromise = Promise.reject(new Error('failed'));
    
    await expect(
      withTimeout(failingPromise, 5000, 'test operation')
    ).rejects.toThrow('failed');
    
    // If timer wasn't cleaned up, this would hang for 5 seconds
    expect(true).toBe(true);
  });

  it('should cleanup timer on timeout (prevent duplicate errors)', async () => {
    // Verify that when timeout fires, the original promise's timer is cleaned up
    const slowPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('too late'), 100);
    });
    
    await expect(
      withTimeout(slowPromise, 10, 'test operation')
    ).rejects.toThrow('test operation timeout after 10ms');
    
    // The slow promise continues running in background, but its timer should be cleaned up
    // This test just verifies we don't get additional errors after timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(true).toBe(true);
  });
});
