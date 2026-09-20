import { describe, expect, it } from 'vitest';

import { paymentScheduleToCsv } from './csv.js';
import { buildPaymentSchedule } from './paymentDates.js';

describe('paymentScheduleToCsv', () => {
  it('renders a header, one row per month, and a trailing newline', () => {
    const csv = paymentScheduleToCsv(
      buildPaymentSchedule([
        { year: 2026, month: 11 },
        { year: 2026, month: 12 },
      ]),
    );
    expect(csv).toBe(
      'Month,Salary payment date,Bonus payment date\n' +
        'November,2026-11-30,2026-11-18\n' +
        'December,2026-12-31,2026-12-15\n',
    );
  });

  it('renders only the header for an empty schedule', () => {
    expect(paymentScheduleToCsv([])).toBe(
      'Month,Salary payment date,Bonus payment date\n',
    );
  });
});
