// The 3D game. Loaded lazily (three.js + physics are large), only when someone presses Play.

import { Canvas } from '@react-three/fiber';
import { Physics, type RapierRigidBody } from '@react-three/rapier';
import { Suspense, useCallback, useEffect, useReducer, useRef, useState, type KeyboardEvent } from 'react';
import { useGameVisibility } from '../../hooks/useGameVisibility';
import { FreeKickHud } from './FreeKickHud';
import { decideOutcome, gameReducer, initialGameState, type ShotEvents } from './gameReducer';
import { CAMERA_POSITION, TARGET_SLOTS, clampAim, shotVelocity } from './geometry';
import { AimMarker, AimSurface } from './scene/Aim';
import { Ball, kickBall, resetBall } from './scene/Ball';
import { Goal } from './scene/Goal';
import { Keeper } from './scene/Keeper';
import { Pitch } from './scene/Pitch';
import { ShotWatcher } from './scene/ShotWatcher';
import { CameraRig, Stadium } from './scene/Stadium';
import { Target } from './scene/Target';
import { TargetCards } from './TargetCards';
import type { KickTarget } from './targets';

const DEBUG = import.meta.env.DEV && window.location.search.includes('debug');
const freshEvents = (): ShotEvents => ({ inGoal: false, keeperTouched: false, postTouched: false });
const AIM_STEP = 0.25;
const KEY_AIM: Record<string, [number, number]> = {
  ArrowLeft: [-AIM_STEP, 0],
  ArrowRight: [AIM_STEP, 0],
  ArrowUp: [0, AIM_STEP],
  ArrowDown: [0, -AIM_STEP],
};

export default function FreeKickGame({ targets }: { targets: KickTarget[] }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [labelPositions, setLabelPositions] = useState<{ left: string; top: string }[]>([]);
  const ball = useRef<RapierRigidBody>(null);
  const aim = useRef<[number, number]>([0, 1.2]);
  const events = useRef<ShotEvents>(freshEvents());
  const stage = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pause = useCallback(() => setPaused(true), []);
  const visible = useGameVisibility(stage, true, pause);
  const active = visible && !paused;
  const resume = useCallback(() => {
    setPaused(false);
    stage.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!paused || !visible) return;
    const onSpace = (event: globalThis.KeyboardEvent) => {
      if (event.key !== ' ' || event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (event.target !== document.body && event.target !== stage.current) return;
      event.preventDefault();
      if (!event.repeat) resume();
    };
    window.addEventListener('keydown', onSpace);
    return () => window.removeEventListener('keydown', onSpace);
  }, [paused, visible, resume]);
  const ready = state.phase === 'ready';

  const shoot = useCallback(() => {
    if (!active || !ready || !ball.current) return;
    events.current = freshEvents();
    kickBall(ball.current, shotVelocity(aim.current), (Math.random() * 2 - 1) * 4);
    dispatch({ type: 'shoot' });
  }, [active, ready]);

  const finishShot = useCallback(() => {
    dispatch({ type: 'shotOver', ...decideOutcome(events.current) });
    if (ball.current) resetBall(ball.current);
  }, []);

  const restart = () => {
    dispatch({ type: 'reset' });
    if (ball.current) resetBall(ball.current);
  };

  const onHit = useCallback((id: string) => {
    events.current.targetId ??= id;
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!active || event.target !== stage.current || event.repeat && event.key === ' ') return;
    const move = KEY_AIM[event.key];
    if (move) {
      aim.current = clampAim([aim.current[0] + move[0], aim.current[1] + move[1]]);
    } else if (event.key === ' ' || event.key === 'Enter') {
      shoot();
    } else {
      return;
    }
    event.preventDefault();
  };

  return (
    <div className="freekick">
      <div
        ref={stage}
        className="freekick__stage"
        tabIndex={0}
        role="group"
        aria-label="Free-kick game. Arrow keys move the aim, Space or Enter shoots."
        onKeyDown={onKeyDown}
      >
        <Canvas shadows dpr={[1, 2]} camera={{ position: CAMERA_POSITION, fov: 50 }} frameloop={active ? 'always' : 'never'}>
          <CameraRig onLayout={setLabelPositions} />
          <Stadium />
          <Suspense fallback={null}>
            {/* Add ?debug to the URL in dev to draw every collider. */}
            <Physics paused={!active} debug={DEBUG}>
              <Pitch />
              <Goal
                onWoodwork={() => {
                  events.current.postTouched = true;
                }}
                onInGoal={() => {
                  events.current.inGoal = true;
                }}
              />
              <Keeper
                onSave={() => {
                  events.current.keeperTouched = true;
                }}
              />
              {targets.slice(0, TARGET_SLOTS.length).map((target, i) => (
                <Target key={target.id} target={target} slot={TARGET_SLOTS[i]!} found={state.found.includes(target.id)} onHit={onHit} />
              ))}
              <Ball ref={ball} />
            </Physics>
          </Suspense>
          <AimSurface aim={aim} onShoot={shoot} />
          <AimMarker aim={aim} visible={ready} />
          <ShotWatcher flying={!ready} ball={ball} onShotOver={finishShot} />
        </Canvas>
        {targets.slice(0, labelPositions.length).map((target, index) => {
          const found = state.found.includes(target.id);
          return (
            <span key={target.id} style={labelPositions[index]} className={`freekick-label${found ? ' freekick-label--found' : ''}`}>
              {found ? '✓ ' : ''}{target.label}
            </span>
          );
        })}
        {paused ? (
          <div className="rep-overlay">
            <p className="rep-overlay__title">Paused</p>
            <button type="button" className="button button--primary" disabled={!visible} onClick={resume}>Resume</button>
          </div>
        ) : <FreeKickHud state={state} targets={targets} onRestart={restart} />}
      </div>
      <TargetCards targets={targets} found={state.found} />
    </div>
  );
}
