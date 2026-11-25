// Maps a day's count to one of five colour steps (0 = no commits).
// Steps 1-4 split the non-zero days into quartiles, like GitHub, so one huge
// day doesn't wash every other day out to the lightest blue.

export type Level = 0 | 1 | 2 | 3 | 4;
export type Thresholds = readonly [number, number, number];

function quantile(sorted: number[], p: number): number {
  const index = Math.max(0, Math.ceil(p * sorted.length) - 1);
  return sorted[index] ?? 0;
}

export function thresholds(counts: number[]): Thresholds {
  const positive = counts.filter((c) => c > 0).sort((a, b) => a - b);
  return [quantile(positive, 0.25), quantile(positive, 0.5), quantile(positive, 0.75)];
}

export function levelFor(count: number, t: Thresholds): Level {
  if (count <= 0) return 0;
  return (1 + t.filter((limit) => count > limit).length) as Level;
}

/** Human ranges for the legend, e.g. ['No commits', '1', '2–3', '4–6', '7+']; '—' marks an unused step. */
export function levelRanges(t: Thresholds): string[] {
  const bounds = [0, ...t];
  const ranges = ['No commits'];
  for (let i = 0; i < 3; i++) {
    const low = (bounds[i] ?? 0) + 1;
    const high = bounds[i + 1] ?? 0;
    ranges.push(high < low ? '—' : high === low ? `${low}` : `${low}–${high}`);
  }
  ranges.push(`${(t[2] ?? 0) + 1}+`);
  return ranges;
}
