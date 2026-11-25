// How the lifter's body should look at a given moment. Pure maths, used by the 3D scene.

import { MISS_MS, REP_MS, type RepGameState } from './repGame';

export interface Pose {
  /** 0 = standing tall, 1 = full squat (thighs about parallel). */
  depth: number;
  /** Barbell roll in radians (a wobble on a miss). */
  tilt: number;
}

export const SHIN = 0.46;
export const THIGH = 0.46;
export const TORSO = 0.62;

export function poseAt(last: RepGameState['last'], now: number): Pose {
  if (last) {
    const elapsed = now - last.at;
    if (last.result !== 'miss' && elapsed >= 0 && elapsed < REP_MS) {
      return { depth: Math.sin(Math.PI * (elapsed / REP_MS)), tilt: 0 }; // down and back up
    }
    if (last.result === 'miss' && elapsed >= 0 && elapsed < MISS_MS) {
      const t = elapsed / MISS_MS;
      // Gets stuck halfway and the bar rocks, settling as it recovers.
      return { depth: 0.45 * Math.sin(Math.PI * t), tilt: Math.sin(t * Math.PI * 7) * 0.2 * (1 - t) };
    }
  }
  return { depth: 0, tilt: 0 };
}

export interface LegGeometry {
  /** Angle of each leg segment from vertical. */
  bend: number;
  kneeY: number;
  kneeZ: number;
  hipY: number;
  /** Forward lean of the torso. */
  lean: number;
  shoulderY: number;
  shoulderZ: number;
}

/** Knee, hip and shoulder positions for a squat depth (the person faces +z). */
export function legGeometry(depth: number): LegGeometry {
  const bend = depth * 0.85; // ~49° per segment at full depth: thighs near parallel
  const kneeY = SHIN * Math.cos(bend);
  const kneeZ = SHIN * Math.sin(bend);
  const hipY = kneeY + THIGH * Math.cos(bend);
  const lean = depth * 0.45;
  return {
    bend,
    kneeY,
    kneeZ,
    hipY,
    lean,
    shoulderY: hipY + TORSO * Math.cos(lean),
    shoulderZ: TORSO * Math.sin(lean),
  };
}
