import { describe, expect, it } from 'vitest';

import {
  bonusPaymentDate,
  buildPaymentSchedule,
  formatIsoDate,
  lastDayOfMonth,
  monthName,
  remainderOfYear,
  salaryPaymentDate,
} from './paymentDates.js';

describe('lastDayOfMonth', () => {
  it('handles 31-day and 30-day months', () => {
    expect(lastDayOfMonth({ year: 2026, month: 10 })).toBe(31);
    expect(lastDayOfMonth({ year: 2026, month: 4 })).toBe(30);
  });

  it('handles February in leap and non-leap years', () => {
    expect(lastDayOfMonth({ year: 2024, month: 2 })).toBe(29);
    expect(lastDayOfMonth({ year: 2026, month: 2 })).toBe(28);
  });
});

describe('salaryPaymentDate', () => {
  it('is the last day of the month when it is a weekday', () => {
    // 2026-09-30 is a Wednesday.
    expect(salaryPaymentDate({ year: 2026, month: 9 })).toEqual({
      year: 2026,
      month: 9,
      day: 30,
    });
  });

  it('moves to Friday when the last day is a Saturday', () => {
    // 2026-10-31 is a Saturday.
    expect(salaryPaymentDate({ year: 2026, month: 10 })).toEqual({
      year: 2026,
      month: 10,
      day: 30,
    });
  });

  it('moves to Friday when the last day is a Sunday', () => {
    // 2026-05-31 is a Sunday.
    expect(salaryPaymentDate({ year: 2026, month: 5 })).toEqual({
      year: 2026,
      month: 5,
      day: 29,
    });
  });

  it('handles a weekend February month-end', () => {
    // 2026-02-28 is a Saturday.
    expect(salaryPaymentDate({ year: 2026, month: 2 })).toEqual({
      year: 2026,
      month: 2,
      day: 27,
    });
  });

  it('always falls on a weekday within the last three days of the month', () => {
    for (let year = 2024; year <= 2030; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const date = salaryPaymentDate({ year, month });
        const weekday = new Date(
          Date.UTC(date.year, date.month - 1, date.day),
        ).getUTCDay();
        expect(weekday).toBeGreaterThanOrEqual(1);
        expect(weekday).toBeLessThanOrEqual(5);
        expect(date.month).toBe(month);
        expect(date.day).toBeGreaterThanOrEqual(
          lastDayOfMonth({ year, month }) - 2,
        );
      }
    }
  });
});

describe('bonusPaymentDate', () => {
  it('is the 15th when it is a weekday', () => {
    // 2026-09-15 is a Tuesday.
    expect(bonusPaymentDate({ year: 2026, month: 9 })).toEqual({
      year: 2026,
      month: 9,
      day: 15,
    });
  });

  it('moves to the first Wednesday after the 15th when the 15th is a Saturday', () => {
    // 2026-08-15 is a Saturday; the next Wednesday is the 19th.
    expect(bonusPaymentDate({ year: 2026, month: 8 })).toEqual({
      year: 2026,
      month: 8,
      day: 19,
    });
  });

  it('moves to the first Wednesday after the 15th when the 15th is a Sunday', () => {
    // 2026-11-15 is a Sunday; the next Wednesday is the 18th.
    expect(bonusPaymentDate({ year: 2026, month: 11 })).toEqual({
      year: 2026,
      month: 11,
      day: 18,
    });
  });

  it('never leaves the month of the 15th', () => {
    for (let year = 2024; year <= 2030; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const date = bonusPaymentDate({ year, month });
        expect(date.month).toBe(month);
        expect(date.day).toBeGreaterThanOrEqual(15);
        expect(date.day).toBeLessThanOrEqual(19);
      }
    }
  });
});

describe('remainderOfYear', () => {
  it('runs from the given month through December', () => {
    expect(remainderOfYear({ year: 2026, month: 9 })).toEqual([
      { year: 2026, month: 9 },
      { year: 2026, month: 10 },
      { year: 2026, month: 11 },
      { year: 2026, month: 12 },
    ]);
  });

  it('contains a single month when starting in December', () => {
    expect(remainderOfYear({ year: 2026, month: 12 })).toEqual([
      { year: 2026, month: 12 },
    ]);
  });

  it('contains all twelve months when starting in January', () => {
    expect(remainderOfYear({ year: 2026, month: 1 })).toHaveLength(12);
  });
});

describe('buildPaymentSchedule', () => {
  it('produces the complete expected schedule for September-December 2026', () => {
    const schedule = buildPaymentSchedule(
      remainderOfYear({ year: 2026, month: 9 }),
    );
    expect(
      schedule.map((entry) => ({
        month: entry.monthName,
        salary: formatIsoDate(entry.salaryPaymentDate),
        bonus: formatIsoDate(entry.bonusPaymentDate),
      })),
    ).toEqual([
      { month: 'September', salary: '2026-09-30', bonus: '2026-09-15' },
      { month: 'October', salary: '2026-10-30', bonus: '2026-10-15' },
      { month: 'November', salary: '2026-11-30', bonus: '2026-11-18' },
      { month: 'December', salary: '2026-12-31', bonus: '2026-12-15' },
    ]);
  });
});

describe('monthName', () => {
  it('rejects out-of-range months', () => {
    expect(() => monthName(0)).toThrow(RangeError);
    expect(() => monthName(13)).toThrow(RangeError);
  });
});

describe('formatIsoDate', () => {
  it('zero-pads month and day', () => {
    expect(formatIsoDate({ year: 2026, month: 3, day: 5 })).toBe('2026-03-05');
  });
});
