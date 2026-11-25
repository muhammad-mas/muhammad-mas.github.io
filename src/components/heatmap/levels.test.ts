import { describe, expect, it } from 'vitest';
import { levelFor, levelRanges, thresholds } from './levels';

describe('levels', () => {
  it('splits non-zero days into quartiles and keeps 0 as its own level', () => {
    const t = thresholds([0, 0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(t).toEqual([2, 4, 6]);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 30].map((n) => levelFor(n, t))).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('copes with no commits at all', () => {
    const t = thresholds([0, 0]);
    expect(levelFor(0, t)).toBe(0);
    expect(levelFor(3, t)).toBe(4);
  });

  it('describes each step for the legend', () => {
    expect(levelRanges([2, 4, 6])).toEqual(['No commits', '1–2', '3–4', '5–6', '7+']);
    expect(levelRanges([1, 1, 2])).toEqual(['No commits', '1', '—', '2', '3+']);
  });
});
