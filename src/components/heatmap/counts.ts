import type { ContributionsFile, DayKey, DaySplit } from '../../types/contributions';
import type { Filter } from './heatmapReducer';

const EMPTY: DaySplit = { work: 0, personal: 0 };

export function splitFor(data: ContributionsFile, date: DayKey): DaySplit {
  return data.days[date] ?? EMPTY;
}

export function countFor(split: DaySplit, filter: Filter): number {
  if (filter === 'work') return split.work;
  if (filter === 'personal') return split.personal;
  return split.work + split.personal;
}

export interface Totals {
  work: number;
  personal: number;
  total: number;
  activeDays: number;
}

export function totalsFor(data: ContributionsFile, dates: DayKey[]): Totals {
  const totals: Totals = { work: 0, personal: 0, total: 0, activeDays: 0 };
  for (const date of dates) {
    const split = splitFor(data, date);
    totals.work += split.work;
    totals.personal += split.personal;
    if (split.work + split.personal > 0) totals.activeDays++;
  }
  totals.total = totals.work + totals.personal;
  return totals;
}

export interface MonthRow {
  month: DayKey; // first day of the month
  work: number;
  personal: number;
}

/** Monthly totals for the table view, oldest first. */
export function monthlyRows(data: ContributionsFile, dates: DayKey[]): MonthRow[] {
  const rows = new Map<string, MonthRow>();
  for (const date of dates) {
    const month = `${date.slice(0, 7)}-01`;
    const row = rows.get(month) ?? { month, work: 0, personal: 0 };
    const split = splitFor(data, date);
    row.work += split.work;
    row.personal += split.personal;
    rows.set(month, row);
  }
  return [...rows.values()];
}
