/**
 * Payroll date rules for the sales department:
 *
 * - Base salary is paid on the last day of the month. If that day falls on a
 *   Saturday or Sunday, it is paid on the last weekday before it instead.
 * - The bonus (for the previous month) is paid on the 15th. If the 15th falls
 *   on a Saturday or Sunday, it is paid on the first Wednesday after the 15th.
 *
 * All calendar arithmetic uses Date.UTC with UTC accessors, so results are
 * identical regardless of the host machine's timezone.
 */

/** A calendar date without any time or timezone component. Month is 1-12. */
export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** A specific month of a specific year. Month is 1-12. */
export interface YearMonth {
  readonly year: number;
  readonly month: number;
}

export interface PaymentScheduleEntry {
  readonly monthName: string;
  readonly salaryPaymentDate: CalendarDate;
  readonly bonusPaymentDate: CalendarDate;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const SATURDAY = 6;
const SUNDAY = 0;
const WEDNESDAY = 3;

/** 0 = Sunday … 6 = Saturday. */
function dayOfWeek({ year, month, day }: CalendarDate): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isWeekend(date: CalendarDate): boolean {
  const weekday = dayOfWeek(date);
  return weekday === SATURDAY || weekday === SUNDAY;
}

/** Number of days in the given month, accounting for leap years. */
export function lastDayOfMonth({ year, month }: YearMonth): number {
  // Day 0 of the next month is the last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The last day of the month, or the last weekday before it when the last day
 * falls on a weekend.
 */
export function salaryPaymentDate(yearMonth: YearMonth): CalendarDate {
  const { year, month } = yearMonth;
  let day = lastDayOfMonth(yearMonth);
  while (isWeekend({ year, month, day })) {
    day -= 1;
  }
  return { year, month, day };
}

/**
 * The 15th of the month, or the first Wednesday after the 15th when the 15th
 * falls on a weekend. The adjusted date is at latest the 19th, so it always
 * stays within the same month.
 */
export function bonusPaymentDate({ year, month }: YearMonth): CalendarDate {
  let day = 15;
  if (isWeekend({ year, month, day })) {
    do {
      day += 1;
    } while (dayOfWeek({ year, month, day }) !== WEDNESDAY);
  }
  return { year, month, day };
}

/** English name of the month, e.g. 9 -> "September". */
export function monthName(month: number): string {
  const name = MONTH_NAMES[month - 1];
  if (name === undefined) {
    throw new RangeError(`Month must be 1-12, got ${String(month)}`);
  }
  return name;
}

/** The given month through December of the same year, inclusive. */
export function remainderOfYear({ year, month }: YearMonth): YearMonth[] {
  const months: YearMonth[] = [];
  for (let m = month; m <= 12; m += 1) {
    months.push({ year, month: m });
  }
  return months;
}

/** One schedule entry per given month, in the given order. */
export function buildPaymentSchedule(
  months: readonly YearMonth[],
): PaymentScheduleEntry[] {
  return months.map((yearMonth) => ({
    monthName: monthName(yearMonth.month),
    salaryPaymentDate: salaryPaymentDate(yearMonth),
    bonusPaymentDate: bonusPaymentDate(yearMonth),
  }));
}

/** Formats a date as YYYY-MM-DD. */
export function formatIsoDate({ year, month, day }: CalendarDate): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${String(year)}-${pad(month)}-${pad(day)}`;
}
