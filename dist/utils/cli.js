"use strict";
/**
 * Shared CLI failure plumbing.
 *
 * Contract: every failure emits exactly ONE `{"success":false,...}` JSON line on
 * stdout and exits with the command's established code (2 for runtime failures,
 * 1 for usage/parse failures). stderr keeps the human-facing `[cmd]` logs —
 * agents grep those for diagnostics; the JSON line is the machine contract.
 *
 * Command implementations throw CliError (instead of process.exit) so that
 * index.ts's `finally { session.close() }` still runs and the JSON is emitted
 * from exactly one place.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliError = void 0;
exports.fail = fail;
exports.installProcessHandlers = installProcessHandlers;
class CliError extends Error {
    payload;
    exitCode;
    constructor(payload, exitCode = 2) {
        super(String(payload.error ?? 'unknown error'));
        this.name = 'CliError';
        this.payload = payload;
        this.exitCode = exitCode;
    }
}
exports.CliError = CliError;
/** Emit the failure JSON line and exit. Used outside session-scoped try/finally. */
function fail(exitCode, payload, log) {
    if (log)
        console.error(log);
    console.log(JSON.stringify({ success: false, ...payload }));
    process.exit(exitCode);
}
/** Best-effort JSON for escapes the try/catch contract can't see (async gaps). */
function installProcessHandlers() {
    process.on('unhandledRejection', (reason) => {
        const msg = reason instanceof Error ? reason.message : String(reason);
        console.log(JSON.stringify({ success: false, error: `unhandled rejection: ${msg}` }));
        process.exit(2);
    });
    process.on('uncaughtException', (err) => {
        console.log(JSON.stringify({ success: false, error: `uncaught exception: ${err.message}` }));
        process.exit(2);
    });
}
//# sourceMappingURL=cli.js.map