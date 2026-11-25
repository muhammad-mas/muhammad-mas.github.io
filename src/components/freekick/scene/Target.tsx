import { BallCollider, type CollisionPayload } from '@react-three/rapier';
import { GOAL_Z, TARGET_RADIUS } from '../geometry';
import type { KickTarget } from '../targets';
import { isBall } from './isBall';

interface TargetProps {
  target: KickTarget;
  slot: [number, number];
  found: boolean;
  onHit: (id: string) => void;
}

/** A hoop hanging in the goal mouth. The ball passes through it (sensor) and reveals the target. */
export function Target({ target, slot, found, onHit }: TargetProps) {
  const [x, y] = slot;
  const z = GOAL_Z - 0.15;
  const colour = found ? '#0ca30c' : '#2a78d6';

  // Listen for "left" as well as "entered". @react-three/rapier only delivers an enter
  // event if the ball is still inside when the frame ends, and a fast ball can go
  // through a hoop between two frames. Leaving a hoop proves the ball went through it.
  const hit = (payload: CollisionPayload) => {
    if (isBall(payload)) onHit(target.id);
  };

  return (
    <>
      <group position={[x, y, z]}>
        <mesh>
          <torusGeometry args={[TARGET_RADIUS, 0.045, 12, 48]} />
          <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={0.35} />
        </mesh>
        <mesh>
          <circleGeometry args={[TARGET_RADIUS - 0.02, 48]} />
          <meshBasicMaterial color={colour} transparent opacity={found ? 0.35 : 0.18} depthWrite={false} />
        </mesh>
      </group>
      {/* Positioned directly: a body-less collider doesn't pick up a parent group's position. */}
      <BallCollider sensor position={[x, y, z]} args={[TARGET_RADIUS]} onIntersectionEnter={hit} onIntersectionExit={hit} />
    </>
  );
}
