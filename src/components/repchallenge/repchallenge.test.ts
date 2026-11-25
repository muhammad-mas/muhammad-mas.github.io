import { describe, expect, it } from 'vitest';
import { readBest, saveBest } from './bestScore';
import { legGeometry, poseAt, SHIN, THIGH, TORSO } from './liftPose';
import {
  initialRepGame,
  judge,
  markerPosition,
  MISS_MS,
  REP_MS,
  repGameReducer,
  ROUND_MS,
  sweepMs,
  timeLeftMs,
  weightFor,
  zoneHalfWidth,
  type RepGameState,
} from './repGame';

/** The time (ms after the marker starts) at which it first reaches `position`. */
const timeToReach = (position: number, level: number) => (position / 2) * sweepMs(level);

function started(zoneCenter = 0.5): RepGameState {
  return repGameReducer(initialRepGame, { type: 'start', now: 1_000, zoneCenter });
}

describe('marker and zone', () => {
  it('sweeps 0 → 1 → 0 and waits at 0 before starting', () => {
    expect(markerPosition(-50, 0)).toBe(0);
    expect(markerPosition(sweepMs(0) / 4, 0)).toBeCloseTo(0.5);
    expect(markerPosition(sweepMs(0) / 2, 0)).toBeCloseTo(1);
    expect(markerPosition((sweepMs(0) * 3) / 4, 0)).toBeCloseTo(0.5);
  });

  it('judges perfect, clean and miss', () => {
    expect(judge(0.51, 0.5, 0)).toBe('perfect');
    expect(judge(0.6, 0.5, 0)).toBe('clean');
    expect(judge(0.8, 0.5, 0)).toBe('miss');
  });

  it('gets heavier, faster and narrower each level', () => {
    expect([weightFor(0), weightFor(5)]).toEqual([60, 160]);
    expect(sweepMs(5)).toBeLessThan(sweepMs(0));
    expect(zoneHalfWidth(5)).toBeLessThan(zoneHalfWidth(0));
  });
});

describe('repGameReducer', () => {
  it('counts a perfect rep, locks during the squat, then the marker restarts', () => {
    let s = started(0.5);
    const hit = 1_000 + timeToReach(0.5, 0);
    s = repGameReducer(s, { type: 'press', now: hit, nextZoneCenter: 0.3 });
    expect(s).toMatchObject({ reps: 1, perfects: 1, combo: 1, lockedUntil: hit + REP_MS, markerFrom: hit + REP_MS, zoneCenter: 0.3 });
    expect(s.last).toEqual({ result: 'perfect', at: hit, levelUp: false });

    // Mashing during the squat does nothing.
    expect(repGameReducer(s, { type: 'press', now: hit + 100, nextZoneCenter: 0.5 })).toBe(s);
  });

  it('a miss resets the combo and costs time', () => {
    let s = started(0.5);
    s = repGameReducer(s, { type: 'press', now: 1_000 + timeToReach(0.5, 0), nextZoneCenter: 0.5 });
    s = repGameReducer(s, { type: 'press', now: s.lockedUntil + 1, nextZoneCenter: 0.5 }); // marker at ~0: miss
    expect(s).toMatchObject({ reps: 1, misses: 1, combo: 0, bestCombo: 1 });
    expect(s.lockedUntil - s.now).toBe(MISS_MS);
  });

  it('levels up every 5 reps', () => {
    let s = started(0.5);
    for (let i = 0; i < 5; i++) {
      const at = s.markerFrom + timeToReach(0.5, s.level);
      s = repGameReducer(s, { type: 'press', now: at, nextZoneCenter: 0.5 });
    }
    expect(s).toMatchObject({ reps: 5, level: 1, combo: 5 });
    expect(s.last?.levelUp).toBe(true);
  });

  it('ends after 20 seconds and ignores presses afterwards', () => {
    let s = repGameReducer(started(), { type: 'tick', now: 1_000 + ROUND_MS / 2 });
    expect(timeLeftMs(s)).toBe(ROUND_MS / 2);
    s = repGameReducer(s, { type: 'tick', now: 1_000 + ROUND_MS });
    expect(s.phase).toBe('over');
    expect(repGameReducer(s, { type: 'press', now: 1_000 + ROUND_MS + 10, nextZoneCenter: 0.5 })).toBe(s);
  });
});

describe('poseAt / legGeometry', () => {
  it('squats down and back up during a rep', () => {
    const last = { result: 'clean' as const, at: 0, levelUp: false };
    expect(poseAt(last, 0).depth).toBeCloseTo(0);
    expect(poseAt(last, REP_MS / 2).depth).toBeCloseTo(1);
    expect(poseAt(last, REP_MS + 1)).toEqual({ depth: 0, tilt: 0 });
  });

  it('wobbles the bar on a miss', () => {
    const pose = poseAt({ result: 'miss', at: 0, levelUp: false }, MISS_MS / 10);
    expect(Math.abs(pose.tilt)).toBeGreaterThan(0);
    expect(pose.depth).toBeLessThan(0.5);
  });

  it('stands tall at depth 0 and lowers the hips at full depth', () => {
    const tall = legGeometry(0);
    expect(tall.hipY).toBeCloseTo(SHIN + THIGH);
    expect(tall.shoulderY).toBeCloseTo(SHIN + THIGH + TORSO);
    expect(legGeometry(1).hipY).toBeLessThan(tall.hipY - 0.3);
  });
});

describe('best score', () => {
  it('keeps only a better round', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    expect(readBest(storage)).toBe(0);
    expect(saveBest(12, storage)).toBe(true);
    expect(saveBest(9, storage)).toBe(false);
    expect(readBest(storage)).toBe(12);
  });
});
