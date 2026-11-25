import type { CollisionPayload } from '@react-three/rapier';

/** The ball's rigid body carries userData { kind: 'ball' }; everything else ignores other contacts. */
export function isBall(payload: CollisionPayload): boolean {
  return payload.other.rigidBodyObject?.userData?.kind === 'ball';
}
