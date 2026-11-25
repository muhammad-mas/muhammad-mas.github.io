import { OUTCOME_MESSAGES, type GameState } from './gameReducer';
import type { KickTarget } from './targets';

interface FreeKickHudProps {
  state: GameState;
  targets: KickTarget[];
  onRestart: () => void;
}

export function hudMessage(state: GameState, targets: KickTarget[]): string {
  if (state.phase === 'flying') return '';
  if (state.found.length === targets.length && targets.length > 0) {
    return `All ${targets.length} found in ${state.shots} shots!`;
  }
  if (!state.last) return 'Click or tap the goal to shoot';
  if (state.last.outcome === 'target') {
    const target = targets.find((t) => t.id === state.last?.targetId);
    return target ? `${OUTCOME_MESSAGES.target} ${target.label}: ${target.value}` : OUTCOME_MESSAGES.target;
  }
  return OUTCOME_MESSAGES[state.last.outcome];
}

/** Score, restart and the latest result, drawn over the 3D scene. */
export function FreeKickHud({ state, targets, onRestart }: FreeKickHudProps) {
  const message = hudMessage(state, targets);
  return (
    <div className="freekick-hud">
      <p className="freekick-hud__score">
        Shots {state.shots} · Goals {state.goals} · Found {state.found.length}/{targets.length}
      </p>
      <button type="button" className="button freekick-hud__restart" onClick={onRestart}>
        Restart
      </button>
      {message && (
        <p className="freekick-hud__message" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
