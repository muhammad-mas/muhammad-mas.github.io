// Pitch geometry (metres, real goal size) and shot maths. Pure: no three.js.
// x = left/right, y = up, z = towards the goal (negative).

export type Vec3 = [number, number, number];

export const BALL_RADIUS = 0.11;
export const BALL_START: Vec3 = [0, BALL_RADIUS, 0];
/** 13 m out: closer than a real free kick, so the goal is big enough on a phone. */
export const GOAL_Z = -13;
export const GOAL_HALF_WIDTH = 3.66;
export const GOAL_HEIGHT = 2.44;
export const POST_RADIUS = 0.06;
export const NET_DEPTH = 1.8;
export const KEEPER_Z = GOAL_Z + 0.7;
export const GRAVITY = 9.81;
/** Seconds from kick to reaching the goal line. */
export const FLIGHT_TIME = 0.75;
/** Max random miss in metres, so not every shot is perfect. */
export const SPREAD = 0.25;

// Behind and above the ball, zoomed in so the goal fills ~40% of a wide screen.
export const CAMERA_POSITION: Vec3 = [0, 1.6, 6];
export const CAMERA_TARGET: Vec3 = [0, 0.5, GOAL_Z];
export const MIN_FOV = 32;
export const MAX_FOV = 60;

/** Where target boards sit in the goal mouth (x, y), in the order targets are listed. */
export const TARGET_SLOTS: [number, number][] = [
  [-2.9, 1.85],
  [2.9, 1.85],
  [-2.9, 0.62],
  [2.9, 0.62],
  [0, 1.9],
];
export const TARGET_RADIUS = 0.5;

/** Vertical field of view (degrees) that keeps the ball and an 11 m-wide goal area in view at any aspect ratio. */
export function fovFor(aspect: number): number {
  const distance = CAMERA_POSITION[2] - GOAL_Z;
  const halfWidth = Math.atan(5.5 / distance);
  const vertical = (2 * Math.atan(Math.tan(halfWidth) / aspect) * 180) / Math.PI;
  return Math.min(MAX_FOV, Math.max(MIN_FOV, vertical));
}

/** Keeps the aim near the goal, so a wild click still makes a sensible shot. */
export function clampAim([x, y]: [number, number]): [number, number] {
  return [Math.min(5.5, Math.max(-5.5, x)), Math.min(4, Math.max(0.15, y))];
}

/** Initial velocity that carries a ball from `from` to `to` in `time` seconds under gravity. */
export function launchVelocity(from: Vec3, to: Vec3, time: number, gravity = GRAVITY): Vec3 {
  return [(to[0] - from[0]) / time, (to[1] - from[1]) / time + 0.5 * gravity * time, (to[2] - from[2]) / time];
}

/** Velocity for a shot aimed at (x, y) on the goal line, with a little random error. */
export function shotVelocity(aim: [number, number], random: () => number = Math.random): Vec3 {
  const [x, y] = clampAim(aim);
  const jitter = () => (random() * 2 - 1) * SPREAD;
  return launchVelocity(BALL_START, [x + jitter(), Math.max(0.15, y + jitter()), GOAL_Z], FLIGHT_TIME);
}
