// Habit stats worked out from the daily commit counts in contributions.json.

import { addDays, weekday } from '../components/heatmap/calendar';
import type { ContributionsFile, DayKey } from '../types/contributions';

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const total = (data: ContributionsFile, day: DayKey) => {
  const split = data.days[day];
  return split ? split.work + split.personal : 0;
};

export interface Streak {
  days: number;
  start: DayKey | null;
  end: DayKey | null;
}

/** Most consecutive days with at least one commit. */
export function longestStreak(data: ContributionsFile): Streak {
  let best: Streak = { days: 0, start: null, end: null };
  let runStart: DayKey | null = null;
  let runLength = 0;
  for (let day = data.from; day <= data.to; day = addDays(day, 1)) {
    if (total(data, day) > 0) {
      runStart ??= day;
      runLength++;
      if (runLength > best.days) best = { days: runLength, start: runStart, end: day };
    } else {
      runStart = null;
      runLength = 0;
    }
  }
  return best;
}

export interface BusiestWeekday {
  name: string;
  /** Average commits on that weekday across the whole range, one decimal. */
  average: number;
}

/** The weekday with the most commits on average. */
export function busiestWeekday(data: ContributionsFile): BusiestWeekday {
  const sums = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (let day = data.from; day <= data.to; day = addDays(day, 1)) {
    const w = weekday(day);
    sums[w]! += total(data, day);
    counts[w]!++;
  }
  const averages = sums.map((sum, i) => (counts[i] ? sum / counts[i]! : 0));
  const best = averages.indexOf(Math.max(...averages));
  return { name: WEEKDAY_NAMES[best] ?? 'Monday', average: Math.round((averages[best] ?? 0) * 10) / 10 };
}
