import { describe, expect, it } from 'vitest';
import type { ContributionsFile } from '../types/contributions';
import { busiestWeekday, longestStreak } from './habits';

const file = (days: ContributionsFile['days'], from = '2026-11-02', to = '2026-11-15'): ContributionsFile => ({
  generatedAt: '',
  from,
  to,
  days,
  projects: {},
});

describe('longestStreak', () => {
  it('finds the longest run of days with commits', () => {
    const data = file({
      '2026-11-02': { work: 1, personal: 0 },
      '2026-11-03': { work: 0, personal: 2 },
      '2026-11-05': { work: 1, personal: 0 },
      '2026-11-06': { work: 1, personal: 0 },
      '2026-11-07': { work: 0, personal: 1 },
    });
    expect(longestStreak(data)).toEqual({ days: 3, start: '2026-11-05', end: '2026-11-07' });
  });

  it('is zero with no commits', () => {
    expect(longestStreak(file({}))).toEqual({ days: 0, start: null, end: null });
  });
});

describe('busiestWeekday', () => {
  it('averages each weekday over the range', () => {
    // 2026-11-03 and 2026-11-10 are Tuesdays.
    const data = file({
      '2026-11-03': { work: 4, personal: 1 },
      '2026-11-10': { work: 2, personal: 0 },
      '2026-11-05': { work: 3, personal: 0 },
    });
    expect(busiestWeekday(data)).toEqual({ name: 'Tuesday', average: 3.5 });
  });
});
