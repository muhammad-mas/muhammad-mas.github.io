// Privacy guard: the published file may hold dates and counts only.
// Runs before every write and in the test suite against the committed file.

import { ALLOWED_TOP_LEVEL_KEYS, type ContributionsFile } from '../../src/types/contributions.ts';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isCount = (n: unknown) => Number.isInteger(n) && (n as number) >= 0;

export function publicShapeErrors(file: unknown, projectSlugs: string[]): string[] {
  const errors: string[] = [];
  if (typeof file !== 'object' || file === null) return ['not an object'];
  const f = file as Record<string, unknown>;

  for (const key of Object.keys(f)) {
    if (!(ALLOWED_TOP_LEVEL_KEYS as readonly string[]).includes(key)) errors.push(`unexpected top-level key "${key}"`);
  }
  if (typeof f.generatedAt !== 'string') errors.push('generatedAt must be a string');
  if (typeof f.from !== 'string' || !DAY.test(f.from)) errors.push('from must be YYYY-MM-DD');
  if (typeof f.to !== 'string' || !DAY.test(f.to)) errors.push('to must be YYYY-MM-DD');
  if (f.sample !== undefined && typeof f.sample !== 'boolean') errors.push('sample must be a boolean');

  const days = (f.days ?? {}) as Record<string, unknown>;
  for (const [day, value] of Object.entries(days)) {
    if (!DAY.test(day)) errors.push(`days: bad key "${day}"`);
    const v = value as Record<string, unknown>;
    const keys = Object.keys(v ?? {}).sort().join(',');
    if (keys !== 'personal,work' || !isCount(v.work) || !isCount(v.personal)) errors.push(`days["${day}"] must be { work, personal } counts`);
  }

  const projects = (f.projects ?? {}) as Record<string, unknown>;
  for (const [slug, value] of Object.entries(projects)) {
    if (!projectSlugs.includes(slug)) errors.push(`projects: "${slug}" is not a slug in src/content/projects.json`);
    for (const [day, n] of Object.entries((value ?? {}) as Record<string, unknown>)) {
      if (!DAY.test(day) || !isCount(n)) errors.push(`projects["${slug}"]["${day}"] must be a count`);
    }
  }
  return errors;
}

export function assertPublicShape(file: ContributionsFile, projectSlugs: string[]): void {
  const errors = publicShapeErrors(file, projectSlugs);
  if (errors.length) throw new Error(`Refusing to write contributions.json:\n- ${errors.join('\n- ')}`);
}
