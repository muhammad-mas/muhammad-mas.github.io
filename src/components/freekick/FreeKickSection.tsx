import { lazy, Suspense, useMemo, useState } from 'react';
import { profile } from '../../content/profile';
import { projects } from '../../content/projects';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { hasWebGL } from '../../lib/webgl';
import type { ContributionsFile } from '../../types/contributions';
import { TargetCards } from './TargetCards';
import { buildTargets } from './targets';

// three.js + physics only download when someone presses Play.
const FreeKickGame = lazy(() => import('./FreeKickGame'));

type Mode = 'intro' | 'playing' | 'results';

export function FreeKickSection({ contributions }: { contributions?: ContributionsFile }) {
  const reducedMotion = usePrefersReducedMotion();
  const targets = useMemo(() => buildTargets(profile, projects, contributions), [contributions]);
  const [mode, setMode] = useState<Mode>(reducedMotion ? 'results' : 'intro');
  const [canPlay, setCanPlay] = useState(true);

  const play = () => {
    if (!hasWebGL()) {
      setCanPlay(false);
      setMode('results');
      return;
    }
    setMode('playing');
  };

  if (mode === 'playing') {
    return (
      <>
        <Suspense fallback={<div className="freekick__stage freekick__stage--loading">Loading the pitch…</div>}>
          <FreeKickGame targets={targets} />
        </Suspense>
        <div className="freekick__actions">
          <button type="button" className="button" onClick={() => setMode('results')}>
            Skip to the results
          </button>
        </div>
      </>
    );
  }

  if (mode === 'results') {
    return (
      <>
        {!canPlay && (
          <p className="notice" role="status">
            This browser can’t show 3D, so here are the results without the game.
          </p>
        )}
        {canPlay && reducedMotion && (
          <p className="notice">Your device is set to reduce motion, so here are the results without the game.</p>
        )}
        <TargetCards targets={targets} found={[]} revealAll />
        {canPlay && (
          <div className="freekick__actions">
            <button type="button" className="button" onClick={play}>
              {reducedMotion ? 'Play anyway' : 'Play the game'}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="freekick-intro card">
      <div className="freekick-intro__pitch" aria-hidden="true">
        <span className="freekick-intro__goal" />
        <span className="freekick-intro__ball" />
      </div>
      <div className="freekick-intro__body">
        <p className="freekick-intro__lead">
          {targets.length} hoops hang in the goal. Each one hides a number about my work or my coding habits. Beat the keeper to reveal them.
        </p>
        <div className="freekick__actions">
          <button type="button" className="button button--primary" onClick={play}>
            Play
          </button>
          <button type="button" className="button" onClick={() => setMode('results')}>
            Just show me the results
          </button>
        </div>
      </div>
    </div>
  );
}
