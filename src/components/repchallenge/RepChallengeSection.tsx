import { lazy, Suspense, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { hasWebGL } from '../../lib/webgl';
import { readBest, repsLabel } from './bestScore';

// The game (and three.js behind it) only downloads when someone presses Play.
const RepChallengeGame = lazy(() => import('./RepChallengeGame'));

/** Intro card for the gym game; Play swaps in the game. Works without 3D too (just the timing bar). */
export function RepChallengeSection() {
  const reducedMotion = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [show3d, setShow3d] = useState(true);
  const best = readBest();

  if (playing) {
    return (
      <Suspense fallback={<div className="rep-game__stage rep-game__loading">Loading…</div>}>
        <RepChallengeGame show3d={show3d} />
      </Suspense>
    );
  }

  return (
    <div className="freekick-intro card">
      <div className="rep-intro__art" aria-hidden="true">
        <span className="rep-intro__bar" />
      </div>
      <div className="freekick-intro__body">
        <p className="freekick-intro__lead">
          A 3D lifter, a loaded bar and 20 seconds. Time each squat to the green zone; every five clean reps adds 20 kg and speeds things up.
        </p>
        {reducedMotion && <p className="notice">Your device is set to reduce motion, so this plays without the 3D lifter: just the timing bar.</p>}
        <div className="freekick__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              setShow3d(!reducedMotion && hasWebGL());
              setPlaying(true);
            }}
          >
            Play
          </button>
          {best > 0 && <span className="muted">Your best: {repsLabel(best)}</span>}
        </div>
      </div>
    </div>
  );
}
