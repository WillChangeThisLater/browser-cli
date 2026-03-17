# Experiments

This folder contains **repeatable, end-to-end test workflows** for the browser CLI.

Each file is a reproducible test suite with:
- Prerequisites
- Step-by-step commands
- Expected outputs
- Validation checks

## Files

| File | Description |
|------|-------------|
| `tab-navigation-screenshot.md` | E2E test: tab discovery, navigation, screenshots |

## Adding New Experiments

When creating a new test workflow:
1. Use clear filename: `experiments/test-name.md`
2. Include:
   - Prerequisites (Chrome running, CLI built, etc.)
   - Step-by-step commands with expected output
   - Validation checklist
   - Troubleshooting tips
3. Make it reproducible by anyone, anytime

## Test Artifacts

Screenshots and other artifacts from tests are typically saved to `/tmp/`. Reference them in the test file.
