import { CuboidCollider, CylinderCollider, RigidBody, type CollisionPayload } from '@react-three/rapier';
import { GOAL_HALF_WIDTH, GOAL_HEIGHT, GOAL_Z, NET_DEPTH, POST_RADIUS } from '../geometry';
import { isBall } from './isBall';

const POST_X = GOAL_HALF_WIDTH + POST_RADIUS;
const BAR_Y = GOAL_HEIGHT + POST_RADIUS;
const NET_Z = GOAL_Z - NET_DEPTH / 2;

function Net({ position, rotation, size }: { position: [number, number, number]; rotation?: [number, number, number]; size: [number, number] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[size[0], size[1], Math.round(size[0] * 6), Math.round(size[1] * 6)]} />
      <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.45} />
    </mesh>
  );
}

interface GoalProps {
  onWoodwork: () => void;
  onInGoal: () => void;
}

/** Posts and crossbar (solid), a net that soaks up the ball, and a sensor that says "it's in". */
export function Goal({ onWoodwork, onInGoal }: GoalProps) {
  const woodwork = (payload: CollisionPayload) => {
    if (isBall(payload)) onWoodwork();
  };
  const inGoal = (payload: CollisionPayload) => {
    if (isBall(payload)) onInGoal();
  };

  return (
    <>
      {/* Exit counts as a touch too: a quick bounce can start and end between two frames. */}
      <RigidBody type="fixed" colliders={false} restitution={0.7} onCollisionEnter={woodwork} onCollisionExit={woodwork}>
        <CylinderCollider args={[BAR_Y / 2, POST_RADIUS]} position={[-POST_X, BAR_Y / 2, GOAL_Z]} />
        <CylinderCollider args={[BAR_Y / 2, POST_RADIUS]} position={[POST_X, BAR_Y / 2, GOAL_Z]} />
        <CylinderCollider args={[POST_X, POST_RADIUS]} position={[0, BAR_Y, GOAL_Z]} rotation={[0, 0, Math.PI / 2]} />
      </RigidBody>

      {/* Visible frame. */}
      {[-POST_X, POST_X].map((x) => (
        <mesh key={x} position={[x, BAR_Y / 2, GOAL_Z]} castShadow>
          <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, BAR_Y, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, BAR_Y, GOAL_Z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, POST_X * 2 + POST_RADIUS * 2, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} />
      </mesh>

      {/* Net: soft colliders behind and around the goal. */}
      <RigidBody type="fixed" colliders={false} restitution={0.05} friction={2}>
        <CuboidCollider args={[POST_X, BAR_Y / 2, 0.05]} position={[0, BAR_Y / 2, GOAL_Z - NET_DEPTH]} />
        <CuboidCollider args={[0.05, BAR_Y / 2, NET_DEPTH / 2]} position={[-POST_X, BAR_Y / 2, NET_Z]} />
        <CuboidCollider args={[0.05, BAR_Y / 2, NET_DEPTH / 2]} position={[POST_X, BAR_Y / 2, NET_Z]} />
        <CuboidCollider args={[POST_X, 0.05, NET_DEPTH / 2]} position={[0, BAR_Y, NET_Z]} />
      </RigidBody>
      <Net position={[0, BAR_Y / 2, GOAL_Z - NET_DEPTH]} size={[POST_X * 2, BAR_Y]} />
      <Net position={[-POST_X, BAR_Y / 2, NET_Z]} rotation={[0, Math.PI / 2, 0]} size={[NET_DEPTH, BAR_Y]} />
      <Net position={[POST_X, BAR_Y / 2, NET_Z]} rotation={[0, Math.PI / 2, 0]} size={[NET_DEPTH, BAR_Y]} />
      <Net position={[0, BAR_Y, NET_Z]} rotation={[Math.PI / 2, 0, 0]} size={[POST_X * 2, NET_DEPTH]} />

      {/* Behind the goal line and under the bar = a goal. Exit counts too: see Target.tsx. */}
      <CuboidCollider
        sensor
        args={[GOAL_HALF_WIDTH, GOAL_HEIGHT / 2, NET_DEPTH / 2 - 0.1]}
        position={[0, GOAL_HEIGHT / 2, NET_Z - 0.05]}
        onIntersectionEnter={inGoal}
        onIntersectionExit={inGoal}
      />
    </>
  );
}
