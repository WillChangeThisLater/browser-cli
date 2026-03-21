"use strict";
/**
 * Timeout utility - Properly cleans up timers after Promise.race
 *
 * The problem: Promise.race doesn't cancel losing promises. If the losing
 * promise has a setTimeout timer, that timer keeps running and prevents
 * Node.js from exiting.
 *
 * The fix: Wrap the promise with explicit timer cleanup on success or failure.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTimeout = withTimeout;
function withTimeout(promise, timeout, operation) {
    return new Promise((resolve, reject) => {
        const timerId = setTimeout(() => {
            reject(new Error(`${operation} timeout after ${timeout}ms`));
        }, timeout);
        promise
            .then(value => {
            clearTimeout(timerId);
            resolve(value);
        })
            .catch(error => {
            clearTimeout(timerId);
            reject(error);
        });
    });
}
//# sourceMappingURL=timeout.js.map