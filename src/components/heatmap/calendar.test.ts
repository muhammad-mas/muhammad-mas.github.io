import { describe, expect, it } from 'vitest';
import { addDays, buildCalendar, rangeFor, weekday, yearsBetween } from './calendar';

describe('date helpers', () => {
  it('counts Monday as 0 and Sunday as 6', () => {
    expect(weekday('2026-11-23')).toBe(0); // Monday
    expect(weekday('2026-11-29')).toBe(6); // Sunday
  });

  it('adds days across a DST change and a leap day', () => {
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('lists years newest first', () => {
    expect(yearsBetween('2024-01-01', '2026-11-24')).toEqual([2026, 2025, 2024]);
  });
});

describe('rangeFor', () => {
  it('covers 365 days for the last 12 months', () => {
    expect(rangeFor('last12', '2026-11-24')).toEqual({ start: '2025-11-25', end: '2026-11-24', layoutEnd: '2026-11-24' });
  });

  it('covers 182 days (26 weeks) for the last 6 months, about 27 columns', () => {
    const range = rangeFor('last6', '2026-11-24');
    expect(range).toEqual({ start: '2026-05-27', end: '2026-11-24', layoutEnd: '2026-11-24' });
    expect(buildCalendar(range).weeks).toBeLessThanOrEqual(27);
  });

  it('clips the current year at the last synced day but lays out the full year', () => {
    expect(rangeFor(2026, '2026-11-24')).toEqual({ start: '2026-01-01', end: '2026-11-24', layoutEnd: '2026-12-31' });
    expect(rangeFor(2025, '2026-11-24')).toEqual({ start: '2025-01-01', end: '2025-12-31', layoutEnd: '2025-12-31' });
  });
});

describe('buildCalendar', () => {
  it('puts each day in a Monday-first week column', () => {
    // 2025 starts on a Wednesday.
    const calendar = buildCalendar(rangeFor(2025, '2026-11-24'));
    expect(calendar.cells).toHaveLength(365);
    expect(calendar.cells[0]).toEqual({ date: '2025-01-01', week: 0, weekday: 2 });
    expect(calendar.cells.at(-1)).toEqual({ date: '2025-12-31', week: 52, weekday: 2 });
    expect(calendar.weeks).toBe(53);
  });

  it('labels each month once, in order', () => {
    const labels = buildCalendar(rangeFor(2025, '2026-11-24')).monthLabels.map((m) => m.label);
    expect(labels).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
  });

  it('drops a cramped first label when the range starts late in a month', () => {
    const labels = buildCalendar(rangeFor('last12', '2026-11-24')).monthLabels;
    expect(labels[0]?.label).toBe('Dec');
    const columns = labels.map((m) => m.week);
    expect(columns).toEqual([...columns].sort((a, b) => a - b));
  });

  it('draws no cells past the last synced day', () => {
    const calendar = buildCalendar(rangeFor(2026, '2026-11-24'));
    expect(calendar.cells.at(-1)?.date).toBe('2026-11-24');
    expect(calendar.weeks).toBe(53);
  });
});
