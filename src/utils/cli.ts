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

export class CliError extends Error {
	payload: Record<string, unknown>;
	exitCode: number;

	constructor(payload: Record<string, unknown>, exitCode = 2) {
		super(String(payload.error ?? 'unknown error'));
		this.name = 'CliError';
		this.payload = payload;
		this.exitCode = exitCode;
	}
}

/** Emit the failure JSON line and exit. Used outside session-scoped try/finally. */
export function fail(exitCode: number, payload: Record<string, unknown>, log?: string): never {
	if (log) console.error(log);
	console.log(JSON.stringify({ success: false, ...payload }));
	process.exit(exitCode);
}

/** Best-effort JSON for escapes the try/catch contract can't see (async gaps). */
export function installProcessHandlers(): void {
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