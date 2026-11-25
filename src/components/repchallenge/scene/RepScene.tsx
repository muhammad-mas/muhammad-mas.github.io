// The 3D gym. Loaded lazily (three.js) only when the game is opened.

import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import type { PerspectiveCamera } from 'three';
import type { RepGameState } from '../repGame';
import { Lifter } from './Lifter';

// Far enough back that the whole lifter, the bar and the HUD all fit.
const CAMERA: [number, number, number] = [2.0, 1.6, 3.4];

/** Three-quarter view of the lifter; wider on tall phone screens so the whole bar stays in shot. */
function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    camera.fov = aspect < 0.9 ? 56 : aspect < 1.3 ? 46 : 38;
    camera.position.set(...CAMERA);
    camera.lookAt(0, 0.98, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

/** Rubber floor, lifting platform, squat rack, a wall with a mirror and some kit lying around. */
function Gym() {
  return (
    <>
      <color attach="background" args={['#262c34']} />
      <hemisphereLight args={['#f3f6fb', '#2b2f35', 1.1]} />
      <directionalLight
        position={[2.5, 4.5, 3]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#30353c" roughness={1} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.04, 2.4]} />
        <meshStandardMaterial color="#a37b4f" roughness={0.9} />
      </mesh>

      {/* Back wall with a mirror. */}
      <mesh position={[0, 2, -2.2]}>
        <planeGeometry args={[14, 4]} />
        <meshStandardMaterial color="#3b4552" roughness={1} />
      </mesh>
      <mesh position={[0, 1.35, -2.18]}>
        <planeGeometry args={[5, 1.6]} />
        <meshStandardMaterial color="#7b8ea3" metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Squat rack, wide enough for the plates and entirely behind the lifter. */}
      {[-1.08, 1.08].map((x) => (
        <group key={x}>
          {[-1.0, -0.32].map((z) => (
            <mesh key={z} position={[x, 1.1, z]} castShadow>
              <boxGeometry args={[0.07, 2.2, 0.07]} />
              <meshStandardMaterial color="#8d969f" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[x, 0.7, -0.66]}>
            <boxGeometry args={[0.05, 0.05, 0.75]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
        </group>
      ))}
      {[-1.0, -0.32].map((z) => (
        <mesh key={z} position={[0, 2.2, z]}>
          <boxGeometry args={[2.23, 0.07, 0.07]} />
          <meshStandardMaterial color="#8d969f" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Dumbbells on the floor and a plate leaning on the wall. */}
      {[-2.1, -1.8, -1.5].map((x, i) => (
        <group key={x} position={[x, 0.08, 0.6 - i * 0.05]} rotation={[0, 0.3, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
            <meshStandardMaterial color="#c9ced6" />
          </mesh>
          {[-0.13, 0.13].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.07, 6]} />
              <meshStandardMaterial color="#20242a" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[2.0, 0.24, -1.6]} rotation={[0.15, 0.4, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.05, 28]} />
        <meshStandardMaterial color="#e34948" />
      </mesh>
    </>
  );
}

export default function RepScene({ last, level, active }: { last: RepGameState['last']; level: number; active: boolean }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: CAMERA, fov: 42 }} frameloop={active ? 'always' : 'never'}>
      <CameraRig />
      <Gym />
      <group position={[0, 0.04, 0]}>
        <Lifter last={last} level={level} />
      </group>
    </Canvas>
  );
}
