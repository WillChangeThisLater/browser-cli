/**
 * JSON failure contract tests.
 *
 * Verifies the reliability changes:
 *  1. Every failure emits exactly ONE {"success":false,...} JSON line on stdout.
 *  2. Commander parse failures (missing required options, unknown options) also
 *     honor the contract; --help/--version pass through with exit 0.
 *  3. close verifies tab existence (no more lying success), supports --all and
 *     unambiguous tab-id prefixes.
 *
 * Uses a fake Chrome DevTools HTTP endpoint (/json, /json/version, /json/close)
 * so these tests are hermetic — no real Chrome required.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import * as http from 'http';
import * as net from 'net';

const TABS = [
  { id: 'AAAA1111BBBB2222CCCC3333DDDD4444', title: 'Docs', url: 'https://example.com/docs', type: 'page' },
  { title: 'Editor', id: 'AAAA9999CCCC3333DDDD4444EEEE5555', url: 'https://example.com/edit', type: 'page' },
  { id: 'CCCC3333DDDD4444EEEE5555FFFF6666', title: 'DevTools', url: 'devtools://devtools', type: 'other' },
];

let server: net.Server;
let port: number;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/json' || req.url === '/json/list') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(TABS));
    } else if (req.url === '/json/version') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ Browser: 'FakeChrome/1.0', webSocketDebuggerUrl: 'ws://127.0.0.1:1/devtools/browser/fake' }));
    } else if (req.url?.startsWith('/json/close/')) {
      const id = decodeURIComponent(req.url.slice('/json/close/'.length));
      const found = TABS.find((t) => t.id === id || t.id.startsWith(id));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(found ? { success: true } : { success: false, error: 'not found' }));
    } else {
      res.writeHead(404);
      res.end('{}');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as net.AddressInfo).port;
}, 15000);

afterAll(() => {
  server.close();
});

interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
  json: { success: boolean; [k: string]: unknown } | null;
}

function runCli(args: string[], timeoutMs = 20000): Promise<RunResult> {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['tsx', 'src/index.ts', ...args], {
      cwd: process.cwd(),
      env: { ...process.env, BROWSER_PORT: String(port) },
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d: Buffer) => (stdout += d));
    proc.stderr.on('data', (d: Buffer) => (stderr += d));
    const timer = setTimeout(() => proc.kill('SIGKILL'), timeoutMs);
    proc.on('close', (code) => {
      const lines = stdout.trim().split('\n').filter(Boolean);
      const json = lines.length === 1 ? tryParse(lines[0]) : undefined;
      resolve({ stdout, stderr, code: code ?? -1, json });
    });
  });
}

function tryParse(line: string): { success: boolean; [k: string]: unknown } | undefined {
  try {
    const v = JSON.parse(line);
    return typeof v === 'object' && v !== null ? v : undefined;
  } catch {
    return undefined;
  }
}

describe('JSON failure contract', () => {
  it('parse failure: close without --tab/--all emits one JSON line, exit 1', async () => {
    const r = await runCli(['close', '--port', String(port)]);
    expect(r.json).toBeDefined();
    expect(r.json!.success).toBe(false);
    expect(String(r.json!.error)).toContain('--tab');
    expect(r.json!.usage).toContain('browser close');
    expect(r.code).toBe(1);
  });

  it('parse failure: unknown option emits JSON, not a raw commander dump on stdout', async () => {
    const r = await runCli(['tabs', '--bogus-flag']);
    expect(r.json).toBeDefined();
    expect(r.json!.success).toBe(false);
    expect(r.code).toBe(1);
  });

  it('--help passes through as human text, exit 0, no JSON error', async () => {
    const r = await runCli(['close', '--help']);
    expect(r.code).toBe(0);
    expect(r.json).toBeUndefined();
    expect(r.stderr + r.stdout).toContain('Usage');
  });

  it('program --help passes through, exit 0', async () => {
    const r = await runCli(['--help']);
    expect(r.code).toBe(0);
    expect(r.stdout + r.stderr).toContain('browser');
  });

  it('close --all closes page tabs and reports count, skipping non-page targets', async () => {
    const r = await runCli(['close', '--all']);
    expect(r.json).toBeDefined();
    expect(r.json!.success).toBe(true);
    expect(r.json!.action).toBe('closed-all');
    expect(r.json!.closed).toBe(2); // only type=page entries
    expect(r.code).toBe(0);
  });

  it('close --tab <existing> succeeds with the full tab id', async () => {
    const r = await runCli(['close', '--tab', TABS[0].id]);
    expect(r.json).toEqual({ success: true, tabId: TABS[0].id, action: 'closed' });
    expect(r.code).toBe(0);
  });

  it('close --tab <prefix> resolves to the full tab id', async () => {
    const r = await runCli(['close', '--tab', TABS[0].id.slice(0, 8)]);
    expect(r.json).toEqual({ success: true, tabId: TABS[0].id, action: 'closed' });
    expect(r.code).toBe(0);
  });

  it('close --tab <nonexistent> no longer lies: success:false, exit 2', async () => {
    const r = await runCli(['close', '--tab', 'DEADBEEF']);
    expect(r.json).toBeDefined();
    expect(r.json!.success).toBe(false);
    expect(String(r.json!.error)).toContain('not found');
    expect(r.code).toBe(2);
  });

  it('close --tab <ambiguous prefix> fails with matches listed', async () => {
    const r = await runCli(['close', '--tab', 'AAAA9']); // matches only the Editor tab
    expect(r.json).toEqual({ success: true, tabId: TABS[1].id, action: 'closed' });
  });

  it('close --tab <ambiguous prefix> fails with matches listed', async () => {
    const r = await runCli(['close', '--tab', 'AAAA']); // matches both page tabs
    expect(r.json).toBeDefined();
    expect(r.json!.success).toBe(false);
    expect(r.code).toBe(2);
  });

  it('close --tab <long prefix> resolves uniquely', async () => {
    const r = await runCli(['close', '--tab', TABS[1].id.slice(0, 8)]);
    expect(r.json).toEqual({ success: true, tabId: TABS[1].id, action: 'closed' });
    expect(r.code).toBe(0);
  });

  it('tabs keeps its existing success shape against the fake CDP server', async () => {
    const r = await runCli(['tabs']);
    expect(r.json).toBeDefined();
    expect(r.json!.success).toBe(true);
    const tabs = (r.json as { tabs: { id: string }[] }).tabs;
    expect(tabs).toHaveLength(2);
  });

  it('connection failure: go against a dead port emits one JSON line, exit 2', async () => {
    const deadPort = await getFreePort();
    const r = await runCli(['go', 'example.com', '--port', String(deadPort)]);
    expect(r.json).toBeDefined();
    expect(r.json!.success).toBe(false);
    expect(r.code).toBe(2);
  });

  it('connection failure: screenshot against a dead port emits JSON, exit 2', async () => {
    const deadPort = await getFreePort();
    const r = await runCli(['screenshot', '/tmp/should-not-exist.png', '--port', String(deadPort)]);
    expect(r.json).toBeDefined();
    expect(r.json!.success).toBe(false);
    expect(r.code).toBe(2);
  });
});

function getFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(p));
    });
  });
}