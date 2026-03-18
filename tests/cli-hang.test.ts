/**
 * Integration tests for CLI hang prevention
 * 
 * These tests verify that CLI commands exit cleanly without hanging,
 * which was the original bug caused by improper timeout cleanup.
 */

import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('CLI hang prevention', () => {
  // Helper to run CLI with a timeout
  async function runCli(args: string[], timeoutMs: number = 10000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const proc = exec(`npx tsx src/index.ts ${args.join(' ')}`, {
        timeout: timeoutMs,
        env: { ...process.env, BROWSER_TIMEOUT: '5000' },
      });
      
      let stdout = '';
      let stderr = '';
      
      proc.stdout?.on('data', (data: string) => { stdout += data; });
      proc.stderr?.on('data', (data: string) => { stderr += data; });
      
      proc.on('close', (code: number | null) => {
        resolve({ stdout, stderr, exitCode: code ?? 1 });
      });
      
      proc.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  it('should exit cleanly after go command (no 120s hang)', async () => {
    // This is the regression test for the original bug
    // Before the fix, this would hang for up to 120 seconds
    // With the fix, it should complete in < 5 seconds
    
    const { exitCode, stderr } = await runCli(['--port', '9222', 'go', 'news.ycombinator.com'], 10000);
    
    expect(exitCode).toBe(0);
    expect(stderr).toContain('Detaching from Chrome');
  }, 15000);

  it('should exit cleanly after eval command', async () => {
    const { exitCode } = await runCli(['--port', '9222', 'eval', '1 + 1'], 10000);
    
    expect(exitCode).toBe(0);
  }, 15000);

  it('should exit cleanly after screenshot command', async () => {
    const { exitCode } = await runCli(
      ['--port', '9222', 'screenshot', '/tmp/test-hang.png', '--url', 'news.ycombinator.com'],
      10000
    );
    
    expect(exitCode).toBe(0);
  }, 15000);

  it('should exit cleanly after find command', async () => {
    const { exitCode } = await runCli(['--port', '9222', 'find', 'test'], 10000);
    
    expect(exitCode).toBe(0);
  }, 15000);

  it('should exit cleanly after scroll command', async () => {
    const { exitCode } = await runCli(['--port', '9222', 'scroll'], 10000);
    
    expect(exitCode).toBe(0);
  }, 15000);
});
