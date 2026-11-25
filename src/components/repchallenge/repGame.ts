// Rep challenge rules. Pure: time and randomness come in through actions, so it's easy to test.
//
// A marker sweeps a timing bar after each rep. Press "Lift" while it's in the green zone:
// dead centre = perfect, inside = clean rep, outside = a wobble (miss). Every 5 reps the bar
// gets 20 kg heavier, the marker faster and the zone narrower. 20 seconds per round.

export const ROUND_MS = 20_000;
export const REP_MS = 450; // squat animation; presses are ignored meanwhile
export const MISS_MS = 650; // wobble before you can try again
export const REPS_PER_LEVEL = 5;
export const MAX_LEVEL = 5;
export const PERFECT_HALF_WIDTH = 0.035;

export type RepResult = 'perfect' | 'clean' | 'miss';

export interface RepGameState {
  phase: 'ready' | 'playing' | 'paused' | 'over';
  startedAt: number;
  now: number;
  /** Presses before this time are ignored (a rep or wobble is still playing). */
  lockedUntil: number;
  /** When the marker started its current sweep. */
  markerFrom: number;
  /** Centre of the green zone, 0–1 along the bar. */
  zoneCenter: number;
  reps: number;
  perfects: number;
  misses: number;
  combo: number;
  bestCombo: number;
  level: number;
  last: { result: RepResult; at: number; levelUp: boolean } | null;
}

export type RepGameAction =
  | { type: 'pause' | 'resume'; now: number }
  | { type: 'start'; now: number; zoneCenter: number }
  | { type: 'press'; now: number; nextZoneCenter: number }
  | { type: 'tick'; now: number };

export const initialRepGame: RepGameState = {
  phase: 'ready',
  startedAt: 0,
  now: 0,
  lockedUntil: 0,
  markerFrom: 0,
  zoneCenter: 0.5,
  reps: 0,
  perfects: 0,
  misses: 0,
  combo: 0,
  bestCombo: 0,
  level: 0,
  last: null,
};

/** Bar weight in kg: 60, 80, … 160. */
export const weightFor = (level: number) => 60 + 20 * level;

/** Time for the marker to go across and back, in ms. Faster each level. */
export const sweepMs = (level: number) => 1500 - 160 * level;

/** Half-width of the green zone. Narrower each level. */
export const zoneHalfWidth = (level: number) => 0.17 - 0.017 * level;

/** Marker position 0–1: a triangle wave (left → right → left). Before the sweep starts it waits at 0. */
export function markerPosition(elapsedMs: number, level: number): number {
  if (elapsedMs <= 0) return 0;
  const phase = (elapsedMs % sweepMs(level)) / sweepMs(level);
  return phase < 0.5 ? phase * 2 : 2 - phase * 2;
}

export function judge(position: number, zoneCenter: number, level: number): RepResult {
  const distance = Math.abs(position - zoneCenter);
  if (distance <= PERFECT_HALF_WIDTH) return 'perfect';
  if (distance <= zoneHalfWidth(level)) return 'clean';
  return 'miss';
}

/** A random zone centre that keeps the whole zone on the bar. */
export const randomZoneCenter = (random = Math.random) => 0.25 + random() * 0.5;

export const timeLeftMs = (s: RepGameState) =>
  s.phase === 'ready' ? ROUND_MS : Math.max(0, ROUND_MS - (s.now - s.startedAt));

export function repGameReducer(state: RepGameState, action: RepGameAction): RepGameState {
  switch (action.type) {
    case 'pause':
      if (state.phase !== 'playing') return state;
      return { ...state, now: action.now, phase: action.now - state.startedAt >= ROUND_MS ? 'over' : 'paused' };
    case 'resume': {
      if (state.phase !== 'paused') return state;
      const delay = action.now - state.now;
      return { ...state, phase: 'playing', now: action.now, startedAt: state.startedAt + delay,
        markerFrom: state.markerFrom + delay, lockedUntil: state.lockedUntil + delay,
        last: state.last && { ...state.last, at: state.last.at + delay } };
    }
    case 'start':
      return {
        ...initialRepGame,
        phase: 'playing',
        startedAt: action.now,
        now: action.now,
        markerFrom: action.now,
        zoneCenter: action.zoneCenter,
      };

    case 'tick':
      if (state.phase !== 'playing') return state;
      if (action.now - state.startedAt >= ROUND_MS) return { ...state, now: action.now, phase: 'over' };
      return { ...state, now: action.now };

    case 'press': {
      if (state.phase !== 'playing' || action.now < state.lockedUntil) return state;
      if (action.now - state.startedAt >= ROUND_MS) return { ...state, now: action.now, phase: 'over' };

      const result = judge(markerPosition(action.now - state.markerFrom, state.level), state.zoneCenter, state.level);
      const lockedUntil = action.now + (result === 'miss' ? MISS_MS : REP_MS);
      const base = { ...state, now: action.now, lockedUntil, markerFrom: lockedUntil, zoneCenter: action.nextZoneCenter };

      if (result === 'miss') {
        return { ...base, misses: state.misses + 1, combo: 0, last: { result, at: action.now, levelUp: false } };
      }
      const reps = state.reps + 1;
      const combo = state.combo + 1;
      const levelUp = reps % REPS_PER_LEVEL === 0 && state.level < MAX_LEVEL;
      return {
        ...base,
        reps,
        perfects: state.perfects + (result === 'perfect' ? 1 : 0),
        combo,
        bestCombo: Math.max(state.bestCombo, combo),
        level: levelUp ? state.level + 1 : state.level,
        last: { result, at: action.now, levelUp },
      };
    }
  }
}
