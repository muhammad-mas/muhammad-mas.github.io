import type { DayKey } from '../../types/contributions';
import { weekday } from './calendar';

// Built by hand rather than with Intl so every browser (and Node) prints the same text.
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const number = new Intl.NumberFormat('en-GB');

function parts(key: DayKey) {
  const [year, month, day] = key.split('-');
  return { year: year ?? '', month: MONTHS[Number(month) - 1] ?? '', day: String(Number(day)) };
}

/** 'Fri 20 Nov 2026' */
export function formatLongDate(key: DayKey): string {
  const p = parts(key);
  return `${WEEKDAYS[weekday(key)]} ${p.day} ${p.month} ${p.year}`;
}

/** '20 Nov 2026' */
export function formatShortDate(key: DayKey): string {
  const p = parts(key);
  return `${p.day} ${p.month} ${p.year}`;
}

/** 'Nov 2026' */
export function formatMonth(key: DayKey): string {
  const p = parts(key);
  return `${p.month} ${p.year}`;
}

export const formatNumber = (n: number) => number.format(n);

export function commits(n: number): string {
  return `${formatNumber(n)} ${n === 1 ? 'commit' : 'commits'}`;
}
