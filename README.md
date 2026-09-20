# payment-dates

A small CLI that generates a CSV file with the salary and bonus payment dates
for a fictional company's sales department, covering the remainder of the
current year. Built for the Dawn Technology "Mikko test".

## Payment rules

- Base salary is paid on the **last day of the month**. If that day is a
  Saturday or Sunday, it is paid on the **last weekday before** the last day.
- The bonus for the previous month is paid on the **15th**. If the 15th is a
  Saturday or Sunday, it is paid on the **first Wednesday after the 15th**.

## Prerequisites

- Node.js 20 or newer
- npm

No other tools, services, or runtime dependencies are needed.

## Installation

```bash
npm ci
```

## Run

```bash
npm run build
node dist/index.js payment-dates.csv
```

The single argument is the output file path. Run with `--help` to print usage
information. On success the CSV is written and the process exits with code 0. Missing or invalid arguments print a usage
message and exit with code 2; filesystem failures (missing directory,
permission denied, path is a directory) print a descriptive error and exit
with code 1.

Example output (generated in September 2026):

```csv
Month,Salary payment date,Bonus payment date
September,2026-09-30,2026-09-15
October,2026-10-30,2026-10-15
November,2026-11-30,2026-11-18
December,2026-12-31,2026-12-15
```

## Test

```bash
npm test
```

## Lint / format

```bash
npm run lint
npm run format
```

## Build

```bash
npm run build
```

Compiles TypeScript to `dist/`.

## Dependencies

There are **no runtime dependencies** — only the Node.js standard library.
Dev dependencies: TypeScript, Vitest (tests), ESLint + typescript-eslint and
Prettier (linting/formatting).

## Assumptions

- **"Remainder of this year"** means the current month through December,
  inclusive. Running the tool in September produces four rows
  (September–December); running it in December produces one.
- Each CSV row describes the payment dates **occurring in that month**: the
  salary paid for that month, and the bonus paid on/around the 15th of that
  month (which, per the rules, compensates the previous month's sales).
- Month names are written in English; dates are formatted as `YYYY-MM-DD`.
- The current month is taken from the machine's local clock, but all calendar
  arithmetic (weekday and month-length calculations) is done in UTC, so
  results cannot drift across timezones or DST transitions.

## Architecture

Three small modules, separated so the business logic is pure and directly
testable:

- [`src/paymentDates.ts`](src/paymentDates.ts) — the payroll date rules as
  pure functions on plain `{ year, month, day }` values. No IO, no locale, no
  timezone dependence.
- [`src/csv.ts`](src/csv.ts) — renders a schedule as CSV text.
- [`src/cli.ts`](src/cli.ts) — argument parsing, file writing, and error
  reporting. Console output and the current date are injected, allowing CLI
  behavior to be tested deterministically without mocking globals.
- [`src/index.ts`](src/index.ts) — the executable entry point wiring the CLI
  to `process.argv`, the console, and the real clock.

## Tradeoffs

The problem is a deterministic calendar calculation with CSV output, so the
solution is deliberately minimal. A web frontend, API server, database,
Docker, cloud infrastructure, a date library, or a CSV library would add
surface area and dependencies without making the output more correct or the
code clearer — the standard library covers everything this problem needs.
The flowchart in the assignment explicitly allows a CLI, which is the
simplest interface that fits the requirements. If the rules grew (multiple
countries, public holidays, configurable ranges), the pure core in
`paymentDates.ts` is where that logic would slot in without touching the CLI.
