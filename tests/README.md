# Browser CLI Tests

## Running Tests

```bash
# Run all tests once
npm test

# Run in watch mode  
npm run test:watch
```

## Test Structure

### Unit Tests (`timeout.test.ts`)

Tests for the `withTimeout()` utility that prevent the process hang bug:

- **Purpose**: Verify timers are properly cleaned up after operations complete
- **Key test**: `should cleanup timer on success (prevent event loop hang)`
  - Before the fix: Timer from `setTimeout` kept running, blocking Node.js exit
  - After the fix: `clearTimeout()` is called, process exits immediately

### Integration Tests (`cli-hang.test.ts`)

End-to-end tests that verify CLI commands exit cleanly:

- **Purpose**: Catch regressions in the 120-second hang bug
- **How it works**: Runs actual CLI commands with a timeout wrapper
- **Failure mode**: If a command hangs, the test times out and fails

### Bug Scenario Tests (`bug-scenarios.test.ts`)

Tests that catch common bug patterns:

- **CDP Session Leak**: Verifies `client.detach()` is called after every `createCDPSession()`
  - Bug: Commands created CDP sessions but never detached them
  - Impact: Leaked connections to Chrome over time
  - Fix: Added `await client.detach()` after getting tab info

- **Error Handling Consistency**: Verifies all commands use exit code 2 for failures

- **Input Validation**: Tests URL and selector edge cases

- **Timeout Cleanup**: Verifies timers are cleaned up on all code paths

### Edge Case Tests (`edge-cases.test.ts`)

Tests for command input validation and option handling:

- **Type command**: Empty text, special characters, clear/enter options, URL handling
- **Click command**: Wait option, CSS selector patterns
- **Scroll command**: Direction handling, option precedence, boundary conditions
- **Find command**: Search text patterns, filter options, result limiting
- **Eval command**: Return value types, JSON/silent options, code length handling

These tests verify that options are handled correctly and edge cases don't cause crashes.

## Bugs These Tests Prevent

### Bug #1: Process Hang (120s delay)

**Symptom**: CLI commands complete but process hangs for up to 120 seconds.

**Root cause**: `Promise.race([operation, timeoutPromise])` leaves the `setTimeout` timer running.

**Fix**: `withTimeout()` wrapper that calls `clearTimeout()` on success/failure.

### Bug #2: CDP Session Leaks

**Symptom**: Gradual resource exhaustion after many commands.

**Root cause**: `createCDPSession()` without matching `detach()`.

**Fix**: Always call `await client.detach()` after CDP operations.

## Adding New Tests

When adding new commands or timeout handling:

1. Add unit test for any new timeout logic
2. Add integration test if the command uses `withTimeout()`
3. Verify `client.detach()` is called after any `createCDPSession()`
4. Ensure tests complete in < 15 seconds (adjust timeout if needed)
