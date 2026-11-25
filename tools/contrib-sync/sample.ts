// npm run sync:sample — writes made-up data (flagged "sample": true) so the
// site has something to draw before the first real sync. Deterministic.

import { writeFileSync } from 'node:fs';
import type { ContributionsFile, DayKey } from '../../src/types/contributions.ts';
import { toLocalDay } from './aggregate.ts';
import { OUTPUT_PATH } from './config.ts';
import { serializeContributions } from './serialize.ts';

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20240101);
const from: DayKey = '2024-01-01';
const to: DayKey = toLocalDay(new Date().toISOString(), 'Europe/London');
const days: ContributionsFile['days'] = {};
const paperworkBrain: Record<DayKey, number> = {};

for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86_400_000) {
  const date = new Date(t);
  const day = date.toISOString().slice(0, 10);
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
  const work = !weekend && random() > 0.18 ? Math.floor(random() ** 1.6 * 9) + 1 : 0;
  const projectPhase = day >= '2026-11-04';
  const personalChance = projectPhase ? 0.75 : weekend ? 0.25 : 0.08;
  const personal = random() < personalChance ? Math.floor(random() ** 2 * (projectPhase ? 10 : 4)) + 1 : 0;
  if (work + personal > 0) days[day] = { work, personal };
  if (projectPhase && personal > 0) paperworkBrain[day] = personal;
}

const file: ContributionsFile = {
  generatedAt: new Date().toISOString(),
  from,
  to,
  sample: true,
  days,
  projects: { 'paperwork-brain': paperworkBrain },
};

writeFileSync(OUTPUT_PATH, serializeContributions(file));
console.log(`Wrote sample data to ${OUTPUT_PATH}`);
