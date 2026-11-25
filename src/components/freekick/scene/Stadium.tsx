import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Vector3, type PerspectiveCamera } from 'three';
import { CAMERA_POSITION, CAMERA_TARGET, GOAL_Z, TARGET_SLOTS, fovFor } from '../geometry';

/** Keeps the camera behind the ball with a field of view that fits phones and wide screens. */
export function CameraRig({ onLayout }: { onLayout: (positions: { left: string; top: string }[]) => void }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);

  useEffect(() => {
    camera.fov = fovFor(size.width / Math.max(1, size.height));
    camera.position.set(...CAMERA_POSITION);
    camera.lookAt(...CAMERA_TARGET);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    onLayout(TARGET_SLOTS.map(([x, y]) => {
      const point = new Vector3(x, y, GOAL_Z - 0.1).project(camera);
      return { left: `${(1 + point.x) * 50}%`, top: `${(1 - point.y) * 50}%` };
    }));
  }, [camera, size, onLayout]);

  return null;
}

/** Sky, light and a simple stand behind the goal. */
export function Stadium() {
  return (
    <>
      <color attach="background" args={['#cfe3f5']} />
      <fog attach="fog" args={['#cfe3f5', 28, 60]} />
      <hemisphereLight args={['#eef6ff', '#3f8f4a', 0.9]} />
      <directionalLight
        position={[6, 12, 6]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />

      {/* Advertising boards and a stand. */}
      <mesh position={[0, 0.45, GOAL_Z - 5]}>
        <boxGeometry args={[34, 0.9, 0.2]} />
        <meshStandardMaterial color="#256abf" />
      </mesh>
      <mesh position={[0, 3, GOAL_Z - 12]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[70, 7, 1]} />
        <meshStandardMaterial color="#56677b" roughness={1} />
      </mesh>
    </>
  );
}
