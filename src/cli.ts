import { writeFileSync } from 'node:fs';

import { paymentScheduleToCsv } from './csv.js';
import { buildPaymentSchedule, remainderOfYear } from './paymentDates.js';

export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;
export const EXIT_USAGE = 2;

const USAGE = `Usage: payment-dates <output-file>

Writes a CSV with the salary and bonus payment dates for the remainder of
the current year (current month through December) to <output-file>.

Example: payment-dates payment-dates.csv`;

export interface CliIo {
  writeOut: (message: string) => void;
  writeError: (message: string) => void;
}

/**
 * Runs the CLI and returns the process exit code. IO and "today" are injected
 * so the function is directly testable.
 */
export function runCli(
  args: readonly string[],
  io: CliIo,
  today: Date,
): number {
  if (args.includes('--help') || args.includes('-h')) {
    io.writeOut(USAGE);
    return EXIT_SUCCESS;
  }
  if (args.length === 0) {
    return usageError(io, 'missing required argument <output-file>.');
  }
  if (args.length > 1) {
    return usageError(
      io,
      `expected exactly one argument <output-file>, got ${String(args.length)}.`,
    );
  }
  const outputFile = args[0];
  if (outputFile === undefined || outputFile.trim() === '') {
    return usageError(io, '<output-file> must not be empty.');
  }
  if (outputFile.startsWith('-')) {
    return usageError(io, `unknown option '${outputFile}'.`);
  }

  const months = remainderOfYear({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const csv = paymentScheduleToCsv(buildPaymentSchedule(months));

  try {
    writeFileSync(outputFile, csv, 'utf8');
  } catch (error) {
    io.writeError(describeWriteError(outputFile, error));
    return EXIT_FAILURE;
  }

  io.writeOut(
    `Wrote payment dates for ${String(months.length)} month(s) to ${outputFile}`,
  );
  return EXIT_SUCCESS;
}

function usageError(io: CliIo, message: string): number {
  io.writeError(`Error: ${message}`);
  io.writeError('');
  io.writeError(USAGE);
  return EXIT_USAGE;
}

function describeWriteError(outputFile: string, error: unknown): string {
  const code =
    error instanceof Error && 'code' in error
      ? (error as NodeJS.ErrnoException).code
      : undefined;
  switch (code) {
    case 'ENOENT':
    case 'ENOTDIR':
      return `Error: cannot write '${outputFile}': the directory does not exist.`;
    case 'EACCES':
    case 'EPERM':
      return `Error: cannot write '${outputFile}': permission denied.`;
    case 'EISDIR':
      return `Error: cannot write '${outputFile}': the path is a directory.`;
    default:
      return `Error: cannot write '${outputFile}': ${error instanceof Error ? error.message : String(error)}`;
  }
}
