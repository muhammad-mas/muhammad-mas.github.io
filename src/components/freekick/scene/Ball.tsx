import { BallCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import type { Ref } from 'react';
import { BALL_RADIUS, BALL_START, type Vec3 } from '../geometry';

// Real ball: 0.43 kg. Density = mass / volume.
const DENSITY = 0.43 / ((4 / 3) * Math.PI * BALL_RADIUS ** 3);

export function Ball({ ref }: { ref: Ref<RapierRigidBody> }) {
  return (
    <RigidBody
      ref={ref}
      colliders={false}
      position={BALL_START}
      ccd
      canSleep={false}
      // No air drag, so the ball lands exactly where the shot maths says.
      linearDamping={0}
      angularDamping={0.4}
      restitution={0.55}
      friction={0.9}
      userData={{ kind: 'ball' }}
    >
      <BallCollider args={[BALL_RADIUS]} density={DENSITY} />
      <mesh castShadow>
        <sphereGeometry args={[BALL_RADIUS, 32, 16]} />
        <meshStandardMaterial color="#f6f6f2" roughness={0.45} />
      </mesh>
      {/* Panel seams. */}
      <mesh scale={1.004}>
        <icosahedronGeometry args={[BALL_RADIUS, 1]} />
        <meshBasicMaterial color="#1d1d1b" wireframe />
      </mesh>
    </RigidBody>
  );
}

export function kickBall(body: RapierRigidBody, velocity: Vec3, spin: number): void {
  body.setLinvel({ x: velocity[0], y: velocity[1], z: velocity[2] }, true);
  body.setAngvel({ x: -12, y: spin, z: 0 }, true);
}

export function resetBall(body: RapierRigidBody): void {
  body.setLinvel({ x: 0, y: 0, z: 0 }, false);
  body.setAngvel({ x: 0, y: 0, z: 0 }, false);
  body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, false);
  body.setTranslation({ x: BALL_START[0], y: BALL_START[1], z: BALL_START[2] }, true);
}
