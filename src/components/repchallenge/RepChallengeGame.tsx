// The rep challenge screen: 3D lifter (or a flat stand-in), timer, timing bar and Lift button.
// Loaded lazily when someone presses Play; the 3D part is a second lazy chunk.

import { lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState, type PointerEvent } from 'react';
import { useInView } from '../../hooks/useInView';
import { useGameVisibility } from '../../hooks/useGameVisibility';
import { readBest, repsLabel, saveBest } from './bestScore';
import {
  initialRepGame,
  markerPosition,
  PERFECT_HALF_WIDTH,
  randomZoneCenter,
  repGameReducer,
  timeLeftMs,
  weightFor,
  zoneHalfWidth,
  type RepGameState,
} from './repGame';

const RepScene = lazy(() => import('./scene/RepScene'));

const FLASH_MS = 900;
const MESSAGES = { perfect: 'Perfect!', clean: 'Clean rep', miss: 'Wobble!' } as const;

function flashFor(state: RepGameState): string | null {
  const last = state.last;
  if (!last || state.now - last.at > FLASH_MS) return null;
  return last.levelUp ? `Level up · ${weightFor(state.level)} kg` : MESSAGES[last.result];
}

const percent = (fraction: number) => `${(fraction * 100).toFixed(2)}%`;

export default function RepChallengeGame({ show3d }: { show3d: boolean }) {
  const [state, dispatch] = useReducer(repGameReducer, initialRepGame);
  const [best, setBest] = useState(readBest);
  const [newBest, setNewBest] = useState(false);
  const latest = useRef(state);
  const marker = useRef<HTMLDivElement>(null);
  const liftButton = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const visible = useInView(stage);
  const playing = state.phase === 'playing';
  const paused = state.phase === 'paused';
  const controls = useRef<HTMLDivElement>(null);
  const pause = useCallback(() => dispatch({ type: 'pause', now: performance.now() }), []);
  const controlsVisible = useGameVisibility(controls, playing || paused, pause);
  const resume = useCallback(() => dispatch({ type: 'resume', now: performance.now() }), []);

  useEffect(() => {
    stage.current?.scrollIntoView({ block: 'start' });
    stage.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (playing) liftButton.current?.focus({ preventScroll: true });
  }, [playing]);

  useEffect(() => {
    latest.current = state;
  }, [state]);

  // Every frame: move the marker directly (no React re-render). Every 100 ms: tick the clock.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let lastTick = 0;
    const loop = () => {
      const now = performance.now();
      const s = latest.current;
      if (marker.current) marker.current.style.left = percent(markerPosition(now - s.markerFrom, s.level));
      if (now - lastTick >= 100) {
        lastTick = now;
        dispatch({ type: 'tick', now });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // Round over: keep the best score.
  useEffect(() => {
    if (state.phase !== 'over') return;
    const isBest = saveBest(state.reps);
    setNewBest(isBest);
    if (isBest) setBest(state.reps);
  }, [state.phase, state.reps]);

  const start = () => {
    setNewBest(false);
    dispatch({ type: 'start', now: performance.now(), zoneCenter: randomZoneCenter() });
  };
  const lift = useCallback(() => dispatch({ type: 'press', now: performance.now(), nextZoneCenter: randomZoneCenter() }), []);

  useEffect(() => {
    if (!visible) liftButton.current?.blur();
    if (!controlsVisible || (!playing && !paused)) return;

    const onSpace = (event: KeyboardEvent) => {
      if (event.key !== ' ' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target !== liftButton.current &&
          (target.isContentEditable || target.closest('button, a, input, textarea, select, summary, [role="button"]'))) return;
      event.preventDefault();
      if (!event.repeat) {
        if (paused) resume();
        else lift();
      }
    };
    window.addEventListener('keydown', onSpace);
    return () => window.removeEventListener('keydown', onSpace);
  }, [lift, playing, visible, paused, controlsVisible, resume]);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (playing && !(event.target as HTMLElement).closest('button')) lift();
  };

  const seconds = Math.ceil(timeLeftMs(state) / 1000);
  const half = zoneHalfWidth(state.level);
  const flash = flashFor(state);

  return (
    <div className="rep-game">
      <div
        ref={stage}
        className="rep-game__stage"
        tabIndex={-1}
        onPointerDown={onPointerDown}
        aria-label="Rep challenge. Press Lift or Space when the marker is in the green zone."
        role="group"
      >
        {show3d ? (
          <Suspense fallback={<div className="rep-game__loading">Loading the gym…</div>}>
            <RepScene last={state.last} level={state.level} active={visible && !paused} />
          </Suspense>
        ) : (
          <div className="rep-game__flat" aria-hidden="true">
            <span className="rep-game__flat-bar" />
          </div>
        )}

        <div className="rep-hud">
          <span className="rep-hud__chip" aria-label={`${seconds} seconds left`}>
            0:{String(seconds).padStart(2, '0')}
          </span>
          <span className="rep-hud__reps">
            <strong>{state.reps}</strong> reps
          </span>
          <span className="rep-hud__chip">{weightFor(state.level)} kg</span>
          {state.combo >= 3 && playing && <span className="rep-hud__combo">×{state.combo} combo</span>}
          {flash && playing && (
            <span key={state.last?.at} className={`rep-hud__flash rep-hud__flash--${state.last?.result}`}>
              {flash}
            </span>
          )}
        </div>

        {!playing && (
          <div className="rep-overlay">
            {state.phase === 'ready' ? (
              <>
                <p className="rep-overlay__title">Squat as many clean reps as you can in 20 seconds</p>
                <p className="rep-overlay__text">Press Lift (or Space, or tap the gym) when the marker is in the green zone. Every 5 reps adds 20 kg.</p>
              </>
            ) : paused ? (
              <p className="rep-overlay__title">Paused · {seconds} seconds left</p>
            ) : (
              <>
                <p className="rep-overlay__title">
                  {repsLabel(state.reps)}
                  {newBest && <span className="rep-overlay__best"> · New best!</span>}
                </p>
                <p className="rep-overlay__text">
                  {state.perfects} perfect · best combo {state.bestCombo} · top weight {weightFor(state.level)} kg
                </p>
              </>
            )}
            <button type="button" className="button button--primary" disabled={paused && !controlsVisible} onClick={paused ? resume : start}>
              {paused ? 'Resume' : state.phase === 'ready' ? 'Start' : 'Go again'}
            </button>
            {best > 0 && <p className="rep-overlay__text">Your best: {repsLabel(best)}</p>}
          </div>
        )}
      </div>

      {(playing || paused) && <>
      <div ref={controls} className="rep-meter" aria-hidden="true">
        <div className="rep-meter__zone" style={{ left: percent(state.zoneCenter - half), width: percent(half * 2) }}>
          <div className="rep-meter__perfect" style={{ width: percent(PERFECT_HALF_WIDTH / half) }} />
        </div>
        <div ref={marker} className="rep-meter__marker" style={{ left: '0%' }} />
      </div>

      <button ref={liftButton} type="button" className="button button--primary rep-game__lift" disabled={!playing} onClick={lift}>
        Lift
      </button>
      </>}

      <p className="visually-hidden" aria-live="polite">
        {state.phase === 'over' ? `Time! ${state.reps} reps, ${state.perfects} perfect.` : state.last?.levelUp ? `Level up: ${weightFor(state.level)} kilograms.` : ''}
      </p>
    </div>
  );
}
