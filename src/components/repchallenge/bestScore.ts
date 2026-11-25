// The visitor's best round, kept in their own browser only.

const KEY = 'rep-challenge-best';

/** '1 rep', '14 reps' */
export const repsLabel = (n: number) => `${n} ${n === 1 ? 'rep' : 'reps'}`;

export function readBest(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): number {
  try {
    const value = Number(storage?.getItem(KEY));
    return Number.isInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0; // storage blocked (private mode)
  }
}

/** Saves `reps` if it beats the best; returns true when it's a new best. */
export function saveBest(reps: number, storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = globalThis.localStorage): boolean {
  if (reps <= readBest(storage)) return false;
  try {
    storage?.setItem(KEY, String(reps));
  } catch {
    // Not remembered, but still a new best this time.
  }
  return true;
}
