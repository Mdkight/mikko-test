import { formatIsoDate, type PaymentScheduleEntry } from './paymentDates.js';

/**
 * Renders the payment schedule as CSV with a header row and a trailing
 * newline. No field escaping is needed: month names and ISO dates never
 * contain commas, quotes, or line breaks.
 */
export function paymentScheduleToCsv(
  entries: readonly PaymentScheduleEntry[],
): string {
  const header = 'Month,Salary payment date,Bonus payment date';
  const rows = entries.map(
    (entry) =>
      `${entry.monthName},${formatIsoDate(entry.salaryPaymentDate)},${formatIsoDate(entry.bonusPaymentDate)}`,
  );
  return [header, ...rows].join('\n') + '\n';
}
