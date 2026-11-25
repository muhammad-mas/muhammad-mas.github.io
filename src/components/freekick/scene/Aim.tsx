import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import type { Mesh } from 'three';
import { GOAL_Z, clampAim } from '../geometry';

interface AimSurfaceProps {
  aim: RefObject<[number, number]>;
  onShoot: () => void;
}

/**
 * An invisible wall across the goal line. Pointer moves place the crosshair;
 * a click or tap shoots at that spot (a tap sets the spot and shoots at once).
 */
export function AimSurface({ aim, onShoot }: AimSurfaceProps) {
  const setAim = (event: ThreeEvent<PointerEvent | MouseEvent>) => {
    aim.current = clampAim([event.point.x, event.point.y]);
  };

  return (
    <mesh
      position={[0, 3, GOAL_Z]}
      onPointerMove={setAim}
      onClick={(event) => {
        event.stopPropagation();
        setAim(event);
        onShoot();
      }}
    >
      <planeGeometry args={[40, 12]} />
      {/* Raycasts still hit fully transparent meshes; invisible ones would not. */}
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** Crosshair on the goal line that follows the aim; hidden while the ball is in the air. */
export function AimMarker({ aim, visible }: { aim: RefObject<[number, number]>; visible: boolean }) {
  const marker = useRef<Mesh>(null);
  useFrame(() => {
    if (!marker.current) return;
    const [x, y] = aim.current;
    marker.current.position.set(x, y, GOAL_Z + 0.05);
  });

  return (
    <mesh ref={marker} visible={visible}>
      <ringGeometry args={[0.16, 0.22, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthTest={false} />
    </mesh>
  );
}
