// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { azureDays, buildOutput, gitHubDays, repoDays, toLocalDay } from './aggregate.ts';
import type { AzureCache, GitHubCache } from './cache.ts';

const azure = (commits: Record<string, string>): AzureCache => ({
  version: 1,
  lastSync: null,
  tips: {},
  pullRequests: {},
  commits: Object.fromEntries(Object.entries(commits).map(([sha, at]) => [sha, { at, repo: 'p/r' }])),
});

describe('toLocalDay', () => {
  it('uses London summer time (UTC+1)', () => {
    expect(toLocalDay('2026-07-14T23:30:00Z', 'Europe/London')).toBe('2026-07-15');
  });

  it('uses London winter time (UTC+0)', () => {
    expect(toLocalDay('2026-01-14T23:30:00Z', 'Europe/London')).toBe('2026-01-14');
  });

  it('respects the commit offset by converting the instant', () => {
    expect(toLocalDay('2026-03-01T01:00:00+05:00', 'Europe/London')).toBe('2026-02-28');
  });
});

describe('azureDays', () => {
  it('counts each SHA once even when it appears in two org caches', () => {
    const days = azureDays(
      [azure({ a: '2026-11-14T10:00:00Z', b: '2026-11-14T11:00:00Z' }), azure({ a: '2026-11-14T10:00:00Z' })],
      'Europe/London',
    );
    expect(days).toEqual({ '2026-11-14': 2 });
  });
});

describe('gitHubDays / repoDays', () => {
  const cache: GitHubCache = {
    version: 1,
    lastSync: null,
    repos: { 'me/one': { '2026-11-01': 2 }, 'me/Two': { '2026-11-01': 3, '2026-11-02': 1 } },
  };

  it('sums all repos except excluded ones', () => {
    expect(gitHubDays(cache)).toEqual({ '2026-11-01': 5, '2026-11-02': 1 });
    expect(gitHubDays(cache, ['ME/two'])).toEqual({ '2026-11-01': 2 });
  });

  it('finds a repo case-insensitively', () => {
    expect(repoDays(cache, 'me/two')).toEqual({ '2026-11-01': 3, '2026-11-02': 1 });
    expect(repoDays(cache, 'me/missing')).toEqual({});
  });
});

describe('buildOutput', () => {
  it('merges sources by kind, drops zero and out-of-range days, sorts keys', () => {
    const out = buildOutput({
      sources: [
        { kind: 'work', days: { '2026-11-02': 4, '2026-11-01': 1, '2023-12-31': 9 } },
        { kind: 'personal', days: { '2026-11-02': 2, '2026-11-03': 0 } },
        { kind: 'personal', days: { '2026-11-02': 1 } },
      ],
      projects: [{ slug: 'paperwork-brain', days: { '2026-11-02': 3, '2027-01-01': 1 } }],
      from: '2024-01-01',
      to: '2026-11-24',
      generatedAt: '2026-11-24T00:00:00.000Z',
    });

    expect(out.days).toEqual({ '2026-11-01': { work: 1, personal: 0 }, '2026-11-02': { work: 4, personal: 3 } });
    expect(Object.keys(out.days)).toEqual(['2026-11-01', '2026-11-02']);
    expect(out.projects).toEqual({ 'paperwork-brain': { '2026-11-02': 3 } });
    expect(Object.keys(out).sort()).toEqual(['days', 'from', 'generatedAt', 'projects', 'to']);
  });
});
