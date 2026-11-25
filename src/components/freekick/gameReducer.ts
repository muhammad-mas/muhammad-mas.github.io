export type Outcome = 'target' | 'goal' | 'saved' | 'post' | 'miss';

export interface ShotResult {
  outcome: Outcome;
  targetId?: string;
}

export interface GameState {
  phase: 'ready' | 'flying';
  shots: number;
  goals: number;
  /** Target ids hit so far, in the order they were found. */
  found: string[];
  last: ShotResult | null;
}

export type GameAction = { type: 'shoot' } | ({ type: 'shotOver' } & ShotResult) | { type: 'reset' };

export const initialGameState: GameState = { phase: 'ready', shots: 0, goals: 0, found: [], last: null };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'shoot':
      if (state.phase !== 'ready') return state;
      return { ...state, phase: 'flying', shots: state.shots + 1, last: null };
    case 'shotOver': {
      if (state.phase !== 'flying') return state;
      const scored = action.outcome === 'target' || action.outcome === 'goal';
      const isNew = action.targetId !== undefined && !state.found.includes(action.targetId);
      return {
        ...state,
        phase: 'ready',
        goals: state.goals + (scored ? 1 : 0),
        found: isNew ? [...state.found, action.targetId!] : state.found,
        last: { outcome: action.outcome, targetId: action.targetId },
      };
    }
    case 'reset':
      return initialGameState;
  }
}

/** What happened during one shot, collected from physics events. */
export interface ShotEvents {
  targetId?: string;
  inGoal: boolean;
  keeperTouched: boolean;
  postTouched: boolean;
}

export function decideOutcome(events: ShotEvents): ShotResult {
  if (events.targetId) return { outcome: 'target', targetId: events.targetId };
  if (events.inGoal) return { outcome: 'goal' };
  if (events.keeperTouched) return { outcome: 'saved' };
  if (events.postTouched) return { outcome: 'post' };
  return { outcome: 'miss' };
}

export const OUTCOME_MESSAGES: Record<Outcome, string> = {
  target: 'Top bins! You found one.',
  goal: 'Goal! Now hit a target.',
  saved: 'Saved by the keeper.',
  post: 'Off the woodwork!',
  miss: 'Wide. Try again.',
};
