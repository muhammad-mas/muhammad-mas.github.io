// Pure date helpers for the heatmap. Days are 'YYYY-MM-DD' strings and all
// arithmetic happens in UTC, so daylight-saving changes can't shift a cell.

import type { DayKey } from '../../types/contributions';

const DAY_MS = 86_400_000;

export function parseDay(key: DayKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function formatDay(ms: number): DayKey {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(key: DayKey, days: number): DayKey {
  return formatDay(parseDay(key) + days * DAY_MS);
}

export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((parseDay(to) - parseDay(from)) / DAY_MS);
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(key: DayKey): number {
  return (new Date(parseDay(key)).getUTCDay() + 6) % 7;
}

export function minDay(a: DayKey, b: DayKey): DayKey {
  return a < b ? a : b;
}

export function maxDay(a: DayKey, b: DayKey): DayKey {
  return a > b ? a : b;
}

/**
 * 'last12' = the 365 days ending on the last synced day; 'last6' = the last 26 weeks (fits a phone
 * screen without scrolling sideways); a number = that calendar year.
 */
export type RangeOption = 'last12' | 'last6' | number;

export interface DateRange {
  /** First day shown. */
  start: DayKey;
  /** Last day shown (never after the last synced day). */
  end: DayKey;
  /** Last day of the grid layout, so a part-done year still draws full width. */
  layoutEnd: DayKey;
}

export function rangeFor(option: RangeOption, lastSynced: DayKey): DateRange {
  if (option === 'last12') {
    return { start: addDays(lastSynced, -364), end: lastSynced, layoutEnd: lastSynced };
  }
  if (option === 'last6') {
    return { start: addDays(lastSynced, -181), end: lastSynced, layoutEnd: lastSynced };
  }
  const yearEnd = `${option}-12-31`;
  return { start: `${option}-01-01`, end: minDay(yearEnd, lastSynced), layoutEnd: yearEnd };
}

/** Years that have any synced days, newest first. */
export function yearsBetween(from: DayKey, to: DayKey): number[] {
  const years: number[] = [];
  for (let y = Number(to.slice(0, 4)); y >= Number(from.slice(0, 4)); y--) years.push(y);
  return years;
}

export interface CalendarCell {
  date: DayKey;
  /** Column, 0-based from the first week. */
  week: number;
  /** Row, 0 = Monday. */
  weekday: number;
}

export interface MonthLabel {
  week: number;
  label: string;
}

export interface Calendar {
  cells: CalendarCell[];
  weeks: number;
  monthLabels: MonthLabel[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Lays the range out as Monday-first week columns, GitHub style. */
export function buildCalendar(range: DateRange): Calendar {
  const gridStart = addDays(range.start, -weekday(range.start));
  const weekOf = (key: DayKey) => Math.floor(daysBetween(gridStart, key) / 7);

  const cells: CalendarCell[] = [];
  if (range.end >= range.start) {
    for (let key = range.start; key <= range.end; key = addDays(key, 1)) {
      cells.push({ date: key, week: weekOf(key), weekday: weekday(key) });
    }
  }

  const layoutEnd = maxDay(range.layoutEnd, range.end);
  const weeks = weekOf(layoutEnd) + 1;
  const monthLabels: MonthLabel[] = [];
  for (let key = range.start; key <= layoutEnd; key = addDays(key, 1)) {
    const isFirstShownDay = key === range.start;
    if (!isFirstShownDay && !key.endsWith('-01')) continue;
    const week = weekOf(key);
    // A month that starts on a Monday-Thursday owns that column; otherwise the next one.
    const column = weekday(key) <= 3 ? week : week + 1;
    if (column >= weeks) continue;
    const previous = monthLabels.at(-1);
    if (previous && column - previous.week < 3) {
      // Too close to the previous label (a range that starts late in a month): replace it.
      monthLabels.pop();
    }
    monthLabels.push({ week: column, label: MONTHS[Number(key.slice(5, 7)) - 1] ?? '' });
  }

  return { cells, weeks, monthLabels };
}
