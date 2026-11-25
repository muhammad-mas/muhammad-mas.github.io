import { describe, expect, it } from 'vitest';
import { profile } from '../../content/profile';
import { projects } from '../../content/projects';
import type { ContributionsFile } from '../../types/contributions';
import { decideOutcome, gameReducer, initialGameState } from './gameReducer';
import {
  BALL_START,
  FLIGHT_TIME,
  GOAL_Z,
  GRAVITY,
  MAX_FOV,
  MIN_FOV,
  SPREAD,
  clampAim,
  fovFor,
  launchVelocity,
  shotVelocity,
  type Vec3,
} from './geometry';
import { buildTargets } from './targets';

const positionAt = (from: Vec3, v: Vec3, t: number): Vec3 => [from[0] + v[0] * t, from[1] + v[1] * t - 0.5 * GRAVITY * t * t, from[2] + v[2] * t];

describe('shot maths', () => {
  it('launches the ball so it arrives at the aim point after the flight time', () => {
    const to: Vec3 = [2.5, 1.8, GOAL_Z];
    const v = launchVelocity(BALL_START, to, FLIGHT_TIME);
    positionAt(BALL_START, v, FLIGHT_TIME).forEach((value, i) => expect(value).toBeCloseTo(to[i]!, 6));
  });

  it('adds at most the spread in each direction', () => {
    const exact = shotVelocity([1, 1], () => 0.5);
    const worst = shotVelocity([1, 1], () => 1);
    const landingExact = positionAt(BALL_START, exact, FLIGHT_TIME);
    const landingWorst = positionAt(BALL_START, worst, FLIGHT_TIME);
    expect(landingExact[0]).toBeCloseTo(1);
    expect(landingWorst[0] - landingExact[0]).toBeCloseTo(SPREAD);
  });

  it('keeps wild aims near the goal', () => {
    expect(clampAim([20, -3])).toEqual([5.5, 0.15]);
  });

  it('widens the view on tall (phone) screens, within limits', () => {
    expect(fovFor(16 / 9)).toBe(MIN_FOV);
    expect(fovFor(0.6)).toBeGreaterThan(MIN_FOV);
    expect(fovFor(0.6)).toBeLessThanOrEqual(MAX_FOV);
  });
});

describe('gameReducer', () => {
  it('counts shots, goals and new targets once', () => {
    let state = gameReducer(initialGameState, { type: 'shoot' });
    expect(state).toMatchObject({ phase: 'flying', shots: 1 });
    expect(gameReducer(state, { type: 'shoot' })).toBe(state); // can't shoot mid-flight

    state = gameReducer(state, { type: 'shotOver', outcome: 'target', targetId: 'users' });
    state = gameReducer(gameReducer(state, { type: 'shoot' }), { type: 'shotOver', outcome: 'target', targetId: 'users' });
    state = gameReducer(gameReducer(state, { type: 'shoot' }), { type: 'shotOver', outcome: 'saved' });

    expect(state).toMatchObject({ phase: 'ready', shots: 3, goals: 2, found: ['users'], last: { outcome: 'saved' } });
  });

  it('ignores a late result when no shot is in flight', () => {
    expect(gameReducer(initialGameState, { type: 'shotOver', outcome: 'goal' })).toBe(initialGameState);
  });
});

describe('decideOutcome', () => {
  it('prefers target, then goal, then save, then post', () => {
    const none = { inGoal: false, keeperTouched: false, postTouched: false };
    expect(decideOutcome({ ...none, targetId: 'x', inGoal: true })).toEqual({ outcome: 'target', targetId: 'x' });
    expect(decideOutcome({ ...none, inGoal: true, keeperTouched: true })).toEqual({ outcome: 'goal' });
    expect(decideOutcome({ ...none, keeperTouched: true, postTouched: true })).toEqual({ outcome: 'saved' });
    expect(decideOutcome({ ...none, postTouched: true })).toEqual({ outcome: 'post' });
    expect(decideOutcome(none)).toEqual({ outcome: 'miss' });
  });
});

describe('buildTargets', () => {
  const data: ContributionsFile = {
    generatedAt: '',
    from: '2026-11-02',
    to: '2026-11-08',
    sample: true,
    days: { '2026-11-03': { work: 2, personal: 1 }, '2026-11-04': { work: 1, personal: 0 } },
    projects: {},
  };

  it('mixes CV wins, habits from the commit data, and the current project', () => {
    const targets = buildTargets(profile, projects, data);
    expect(targets.map((t) => t.id)).toEqual(['speed', 'users', 'streak', 'weekday', 'project-paperwork-brain']);
    expect(targets.find((t) => t.id === 'streak')).toMatchObject({ value: '2 days' });
    expect(targets.find((t) => t.id === 'weekday')?.value).toBe('Tuesdays');
    expect(targets.find((t) => t.id === 'weekday')?.detail).toMatch(/sample data/);
  });

  it('falls back to CV wins before the commit data has loaded', () => {
    expect(buildTargets(profile, projects).map((t) => t.id)).toEqual(['speed', 'users', 'signups', 'years', 'project-paperwork-brain']);
  });
});
