// Pure functions: caches in, public contributions file out.

import type { ContributionsFile, DayKey } from '../../src/types/contributions.ts';
import type { AzureCache, GitHubCache } from './cache.ts';
import type { Kind } from './config.ts';

const dayFormatters = new Map<string, Intl.DateTimeFormat>();

/** The calendar day (YYYY-MM-DD) an instant falls on in `timeZone`. */
export function toLocalDay(iso: string, timeZone: string): DayKey {
  let formatter = dayFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    dayFormatters.set(timeZone, formatter);
  }
  return formatter.format(new Date(iso));
}

export type DayCounts = Record<DayKey, number>;

function add(target: DayCounts, day: DayKey, n: number): void {
  target[day] = (target[day] ?? 0) + n;
}

/** Azure commits per day, counting each SHA once across every org of the same kind. */
export function azureDays(caches: AzureCache[], timeZone: string): DayCounts {
  const seen = new Set<string>();
  const days: DayCounts = {};
  for (const cache of caches) {
    for (const [sha, commit] of Object.entries(cache.commits)) {
      if (seen.has(sha)) continue;
      seen.add(sha);
      add(days, toLocalDay(commit.at, timeZone), 1);
    }
  }
  return days;
}

/** GitHub commits per day across all repos, minus excluded ones. */
export function gitHubDays(cache: GitHubCache, excludeRepos: string[] = []): DayCounts {
  const excluded = new Set(excludeRepos.map((r) => r.toLowerCase()));
  const days: DayCounts = {};
  for (const [repo, counts] of Object.entries(cache.repos)) {
    if (excluded.has(repo.toLowerCase())) continue;
    for (const [day, n] of Object.entries(counts)) add(days, day, n);
  }
  return days;
}

/** One repo's day counts (repo names compare case-insensitively). */
export function repoDays(cache: GitHubCache, repo: string): DayCounts {
  const match = Object.keys(cache.repos).find((name) => name.toLowerCase() === repo.toLowerCase());
  return match ? { ...cache.repos[match] } : {};
}

function inRange(day: DayKey, from: DayKey, to: DayKey): boolean {
  return day >= from && day <= to;
}

function sortedPositive(days: DayCounts, from: DayKey, to: DayKey): DayCounts {
  const out: DayCounts = {};
  for (const day of Object.keys(days).sort()) {
    const n = days[day] ?? 0;
    if (n > 0 && inRange(day, from, to)) out[day] = n;
  }
  return out;
}

export interface BuildInput {
  sources: { kind: Kind; days: DayCounts }[];
  projects: { slug: string; days: DayCounts }[];
  from: DayKey;
  to: DayKey;
  generatedAt: string;
}

export function buildOutput({ sources, projects, from, to, generatedAt }: BuildInput): ContributionsFile {
  const merged: Record<DayKey, { work: number; personal: number }> = {};
  for (const { kind, days } of sources) {
    for (const [day, n] of Object.entries(days)) {
      if (n <= 0 || !inRange(day, from, to)) continue;
      const entry = (merged[day] ??= { work: 0, personal: 0 });
      entry[kind] += n;
    }
  }
  const days: ContributionsFile['days'] = {};
  for (const day of Object.keys(merged).sort()) days[day] = merged[day]!;

  const projectDays: ContributionsFile['projects'] = {};
  for (const project of projects) projectDays[project.slug] = sortedPositive(project.days, from, to);

  return { generatedAt, from, to, days, projects: projectDays };
}
