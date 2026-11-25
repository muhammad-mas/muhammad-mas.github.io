// @vitest-environment node
// Privacy guard for what actually gets published: runs in CI on every push.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadProjects, OUTPUT_PATH } from './config.ts';
import { serializeContributions } from './serialize.ts';
import { publicShapeErrors } from './validate.ts';

const slugs = loadProjects().map((p) => p.slug);

describe('public/data/contributions.json', () => {
  it('holds only dates and counts', () => {
    const file: unknown = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
    expect(publicShapeErrors(file, slugs)).toEqual([]);
  });
});

describe('publicShapeErrors', () => {
  const valid = { generatedAt: 'x', from: '2024-01-01', to: '2026-11-24', days: {}, projects: {} };

  it('accepts a minimal file', () => {
    expect(publicShapeErrors(valid, slugs)).toEqual([]);
  });

  it('rejects extra keys anywhere', () => {
    expect(publicShapeErrors({ ...valid, repos: ['secret'] }, slugs)).toContain('unexpected top-level key "repos"');
    expect(publicShapeErrors({ ...valid, days: { '2026-11-01': { work: 1, personal: 0, repo: 'x' } } }, slugs)).toHaveLength(1);
    expect(publicShapeErrors({ ...valid, projects: { 'client-portal': {} } }, slugs)).toHaveLength(1);
  });

  it('round-trips through the serializer', () => {
    const file = { ...valid, days: { '2026-11-01': { work: 1, personal: 2 } }, projects: { [slugs[0]!]: { '2026-11-01': 2 } } };
    expect(JSON.parse(serializeContributions(file))).toEqual(file);
  });
});
