import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { GOAL_Z } from '../geometry';

const STRIPE_DEPTH = 3;
const STRIPES = 14;
const LINE = '#f4f4f0';

/** A flat painted line lying on the grass. */
function Line({ x, z, width, depth }: { x: number; z: number; width: number; depth: number }) {
  return (
    <mesh position={[x, 0.004, z]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={LINE} roughness={0.9} />
    </mesh>
  );
}

/** Striped grass, goal line, six-yard box and a vanishing-spray mark at the ball. */
export function Pitch() {
  const firstStripeZ = 8;
  return (
    <>
      <RigidBody type="fixed" colliders={false} friction={1.2} restitution={0.4}>
        <CuboidCollider args={[40, 0.1, 40]} position={[0, -0.1, -10]} />
      </RigidBody>

      {Array.from({ length: STRIPES }, (_, i) => (
        <mesh
          key={i}
          position={[0, 0, firstStripeZ - i * STRIPE_DEPTH - STRIPE_DEPTH / 2]}
          rotation-x={-Math.PI / 2}
          receiveShadow
        >
          <planeGeometry args={[80, STRIPE_DEPTH]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#3f8f4a' : '#4a9c55'} roughness={1} />
        </mesh>
      ))}

      {/* Goal line and six-yard box (5.5 m deep, 18.32 m wide). */}
      <Line x={0} z={GOAL_Z} width={40} depth={0.12} />
      <Line x={0} z={GOAL_Z + 5.5} width={18.32} depth={0.12} />
      <Line x={-9.16} z={GOAL_Z + 2.75} width={0.12} depth={5.5} />
      <Line x={9.16} z={GOAL_Z + 2.75} width={0.12} depth={5.5} />

      {/* Referee's vanishing spray: a short arc in front of the ball. */}
      <mesh position={[0, 0.005, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.32, 0.36, 32, 1, Math.PI * 0.15, Math.PI * 0.7]} />
        <meshBasicMaterial color={LINE} />
      </mesh>
    </>
  );
}
