/**
 * Timeout utility - Properly cleans up timers after Promise.race
 *
 * The problem: Promise.race doesn't cancel losing promises. If the losing
 * promise has a setTimeout timer, that timer keeps running and prevents
 * Node.js from exiting.
 *
 * The fix: Wrap the promise with explicit timer cleanup on success or failure.
 */
export declare function withTimeout<T>(promise: Promise<T>, timeout: number, operation: string): Promise<T>;
//# sourceMappingURL=timeout.d.ts.map