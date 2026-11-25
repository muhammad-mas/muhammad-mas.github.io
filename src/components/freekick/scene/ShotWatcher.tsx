import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { useEffect, useRef, type RefObject } from 'react';

const MAX_SHOT_SECONDS = 3;
const SETTLE_AFTER_SECONDS = 1.4;
const SETTLED_SPEED = 0.35;

interface ShotWatcherProps {
  flying: boolean;
  ball: RefObject<RapierRigidBody | null>;
  /** Called once per shot, when the ball has settled or time is up. */
  onShotOver: () => void;
}

/** Decides when a shot is finished: the ball has come to rest, or 3 seconds have passed. */
export function ShotWatcher({ flying, ball, onShotOver }: ShotWatcherProps) {
  const elapsed = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    elapsed.current = 0;
    done.current = !flying;
  }, [flying]);

  useFrame((_, delta) => {
    if (!flying || done.current || !ball.current) return;
    elapsed.current += Math.min(delta, 0.1);
    const v = ball.current.linvel();
    const speed = Math.hypot(v.x, v.y, v.z);
    if (elapsed.current > MAX_SHOT_SECONDS || (elapsed.current > SETTLE_AFTER_SECONDS && speed < SETTLED_SPEED)) {
      done.current = true;
      onShotOver();
    }
  });

  return null;
}
