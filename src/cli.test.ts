import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  EXIT_FAILURE,
  EXIT_SUCCESS,
  EXIT_USAGE,
  runCli,
  type CliIo,
} from './cli.js';

function makeIo(): CliIo & { out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  return {
    out,
    err,
    writeOut: (message) => out.push(message),
    writeError: (message) => err.push(message),
  };
}

// A fixed "today" keeps CLI tests deterministic: 20 September 2026.
const TODAY = new Date(2026, 8, 20);

describe('runCli', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'payment-dates-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes the schedule CSV to the given file and exits 0', () => {
    const io = makeIo();
    const outputFile = join(tempDir, 'payments.csv');

    expect(runCli([outputFile], io, TODAY)).toBe(EXIT_SUCCESS);
    expect(readFileSync(outputFile, 'utf8')).toBe(
      'Month,Salary payment date,Bonus payment date\n' +
        'September,2026-09-30,2026-09-15\n' +
        'October,2026-10-30,2026-10-15\n' +
        'November,2026-11-30,2026-11-18\n' +
        'December,2026-12-31,2026-12-15\n',
    );
    expect(io.out.join('\n')).toContain('4 month(s)');
  });

  it('prints usage and exits with a usage error when no argument is given', () => {
    const io = makeIo();
    expect(runCli([], io, TODAY)).toBe(EXIT_USAGE);
    expect(io.err.join('\n')).toContain('missing required argument');
    expect(io.err.join('\n')).toContain('Usage:');
  });

  it('rejects extra arguments', () => {
    const io = makeIo();
    expect(runCli(['a.csv', 'b.csv'], io, TODAY)).toBe(EXIT_USAGE);
    expect(io.err.join('\n')).toContain('exactly one argument');
  });

  it('rejects a whitespace-only filename', () => {
    const io = makeIo();
    expect(runCli(['   '], io, TODAY)).toBe(EXIT_USAGE);
    expect(io.err.join('\n')).toContain('must not be empty');
  });

  it('rejects an unknown option instead of treating it as a filename', () => {
    const io = makeIo();
    expect(runCli(['--verbose'], io, TODAY)).toBe(EXIT_USAGE);
    expect(io.err.join('\n')).toContain("unknown option '--verbose'");
  });

  it('prints usage and exits 0 for --help', () => {
    const io = makeIo();
    expect(runCli(['--help'], io, TODAY)).toBe(EXIT_SUCCESS);
    expect(io.out.join('\n')).toContain('Usage:');
  });

  it('reports a friendly error and exits 1 when the directory does not exist', () => {
    const io = makeIo();
    const outputFile = join(tempDir, 'no-such-dir', 'payments.csv');

    expect(runCli([outputFile], io, TODAY)).toBe(EXIT_FAILURE);
    expect(io.err.join('\n')).toContain('the directory does not exist');
  });
});
