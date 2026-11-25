import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';
import { legGeometry, poseAt, SHIN, THIGH, TORSO } from '../liftPose';
import type { RepGameState } from '../repGame';

const SHIRT = '#256abf';
const SHORTS = '#1f2933';
const SKIN = '#c58c66';
const SHOES = '#f2f2ee';
const STEEL = '#c9ced6';
const PLATE_COLOURS = ['#2a78d6', '#e34948', '#eda100', '#1baf7a'];
const HIP_WIDTH = 0.13;

/** Plates on one end of the bar: one more per level, a little smaller each. */
function Plates({ side, count }: { side: 1 | -1; count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[side * (0.64 + i * 0.056), 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.23 - i * 0.018, 0.23 - i * 0.018, 0.05, 28]} />
          <meshStandardMaterial color={PLATE_COLOURS[i % PLATE_COLOURS.length]} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[side * (0.6 + count * 0.056 + 0.02), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.04, 12]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.3} />
      </mesh>
    </>
  );
}

/**
 * A blocky lifter with a barbell on their back, facing the camera (+z). Every frame the pose
 * (squat depth, bar wobble) is worked out from the last rep result and the clock.
 */
export function Lifter({ last, level }: { last: RepGameState['last']; level: number }) {
  const shins = useRef<(Mesh | null)[]>([]);
  const thighs = useRef<(Mesh | null)[]>([]);
  const torso = useRef<Group>(null);
  const bar = useRef<Group>(null);

  useFrame(() => {
    const pose = poseAt(last, performance.now());
    const g = legGeometry(pose.depth);
    [-1, 1].forEach((side, i) => {
      shins.current[i]?.position.set(side * HIP_WIDTH, g.kneeY / 2, g.kneeZ / 2);
      shins.current[i]?.rotation.set(g.bend, 0, 0);
      thighs.current[i]?.position.set(side * HIP_WIDTH, (g.kneeY + g.hipY) / 2, g.kneeZ / 2);
      thighs.current[i]?.rotation.set(-g.bend, 0, 0);
    });
    torso.current?.position.set(0, g.hipY, 0);
    torso.current?.rotation.set(g.lean, 0, 0);
    bar.current?.position.set(0, g.shoulderY + 0.04, g.shoulderZ - 0.08);
    bar.current?.rotation.set(0, 0, pose.tilt);
  });

  return (
    <group>
      {[-1, 1].map((side, i) => (
        <group key={side}>
          {/* Shoe */}
          <mesh position={[side * HIP_WIDTH, 0.04, 0.05]} castShadow>
            <boxGeometry args={[0.12, 0.08, 0.28]} />
            <meshStandardMaterial color={SHOES} />
          </mesh>
          <mesh ref={(m) => void (shins.current[i] = m)} castShadow>
            <boxGeometry args={[0.11, SHIN, 0.12]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
          <mesh ref={(m) => void (thighs.current[i] = m)} castShadow>
            <boxGeometry args={[0.15, THIGH, 0.16]} />
            <meshStandardMaterial color={SHORTS} />
          </mesh>
        </group>
      ))}

      {/* Torso pivots at the hips; head and arms ride along. */}
      <group ref={torso}>
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.36, 0.16, 0.2]} />
          <meshStandardMaterial color={SHORTS} />
        </mesh>
        <mesh position={[0, TORSO / 2 + 0.04, 0]} castShadow>
          <boxGeometry args={[0.44, TORSO - 0.06, 0.24]} />
          <meshStandardMaterial color={SHIRT} />
        </mesh>
        <mesh position={[0, TORSO + 0.17, 0.02]} castShadow>
          <sphereGeometry args={[0.13, 24, 16]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position={[0, TORSO + 0.24, -0.01]}>
          <sphereGeometry args={[0.125, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          <meshStandardMaterial color="#2b2118" />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.32, TORSO - 0.02, -0.07]} rotation={[0, 0, side * 0.35]} castShadow>
              <boxGeometry args={[0.24, 0.1, 0.1]} />
              <meshStandardMaterial color={SHIRT} />
            </mesh>
            <mesh position={[side * 0.45, TORSO + 0.03, -0.08]} castShadow>
              <sphereGeometry args={[0.055, 12, 10]} />
              <meshStandardMaterial color={SKIN} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Barbell, rolling when the lift wobbles. */}
      <group ref={bar}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 2.1, 12]} />
          <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.3} />
        </mesh>
        <Plates side={-1} count={level + 1} />
        <Plates side={1} count={level + 1} />
      </group>
    </group>
  );
}
