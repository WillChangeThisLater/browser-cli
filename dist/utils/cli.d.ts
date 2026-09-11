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
export declare class CliError extends Error {
    payload: Record<string, unknown>;
    exitCode: number;
    constructor(payload: Record<string, unknown>, exitCode?: number);
}
/** Emit the failure JSON line and exit. Used outside session-scoped try/finally. */
export declare function fail(exitCode: number, payload: Record<string, unknown>, log?: string): never;
/** Best-effort JSON for escapes the try/catch contract can't see (async gaps). */
export declare function installProcessHandlers(): void;
//# sourceMappingURL=cli.d.ts.map