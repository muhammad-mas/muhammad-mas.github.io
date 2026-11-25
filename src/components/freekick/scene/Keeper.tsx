import { CuboidCollider, RigidBody, useBeforePhysicsStep, type CollisionPayload, type RapierRigidBody } from '@react-three/rapier';
import { useRef } from 'react';
import { KEEPER_Z } from '../geometry';
import { isBall } from './isBall';

const SWAY = 2.2; // metres either side of centre
const SPEED = 1.0; // radians per second
const KIT = '#eb6834';
const GLOVES = '#f2f2ee';

/** A blocky goalkeeper who shuffles across the goal line. */
export function Keeper({ onSave }: { onSave: () => void }) {
  const body = useRef<RapierRigidBody>(null);
  const swayPhase = useRef(0);
  // Exit counts as a touch too: a quick save can start and end between two frames.
  const touched = (payload: CollisionPayload) => {
    if (isBall(payload)) onSave();
  };

  useBeforePhysicsStep((world) => {
    swayPhase.current += world.timestep * SPEED;
    body.current?.setNextKinematicTranslation({ x: Math.sin(swayPhase.current) * SWAY, y: 0, z: KEEPER_Z });
  });

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[0, 0, KEEPER_Z]}
      restitution={0.4}
      onCollisionEnter={touched}
      onCollisionExit={touched}
    >
      {/* Body plus raised arms. */}
      <CuboidCollider args={[0.28, 0.95, 0.15]} position={[0, 0.95, 0]} />
      <CuboidCollider args={[0.75, 0.12, 0.12]} position={[0, 1.75, 0]} />

      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.42, 0.9, 0.24]} />
        <meshStandardMaterial color="#1f2933" />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[0.56, 0.7, 0.28]} />
        <meshStandardMaterial color={KIT} />
      </mesh>
      <mesh position={[0, 1.78, 0]} castShadow>
        <sphereGeometry args={[0.15, 20, 16]} />
        <meshStandardMaterial color="#c58c66" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.5, 1.6, 0]} rotation={[0, 0, side * -0.9]} castShadow>
            <boxGeometry args={[0.14, 0.55, 0.14]} />
            <meshStandardMaterial color={KIT} />
          </mesh>
          <mesh position={[side * 0.72, 1.82, 0]} castShadow>
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshStandardMaterial color={GLOVES} />
          </mesh>
        </group>
      ))}
    </RigidBody>
  );
}
