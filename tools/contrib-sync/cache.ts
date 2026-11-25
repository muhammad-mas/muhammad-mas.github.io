// Local-only caches (gitignored). They hold repo names and commit ids so
// re-runs are incremental and a source without a token keeps its last data.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { DayKey } from '../../src/types/contributions.ts';
import { CACHE_DIR } from './config.ts';

export interface AzureCommitRecord {
  /** Author date, ISO 8601. */
  at: string;
  /** "project/repo", for --verbose output only. */
  repo: string;
}

export interface AzureCache {
  version: 1;
  lastSync: string | null;
  /** Keyed by commit SHA, so the same commit on many branches counts once. */
  commits: Record<string, AzureCommitRecord>;
  /** "repoId:branch" -> tip SHA at last sync; unchanged branches are skipped. */
  tips: Record<string, string>;
  /** "repoId:pullRequestId" of completed pull requests already read (they never change). */
  pullRequests: Record<string, true>;
}

export interface GitHubCache {
  version: 1;
  lastSync: string | null;
  /** "owner/name" -> day -> commits. */
  repos: Record<string, Record<DayKey, number>>;
  /** Absent in older caches, whose daily totals cannot deduplicate incremental results. */
  history?: {
    login: string;
    fromDay: DayKey;
    timeZone: string;
    repos: Record<string, {
      branches: string[];
      commits: Record<string, DayKey>;
    }>;
  };
}

/** Re-read recent history to pick up commits pushed after their author date. */
export function incrementalFromDate(lastSync: string | null, configFrom: DayKey): string {
  const earliest = `${configFrom}T00:00:00Z`;
  if (!lastSync) return earliest;
  const overlapStart = new Date(Date.parse(lastSync) - 30 * 86_400_000).toISOString();
  return Date.parse(overlapStart) < Date.parse(earliest) ? earliest : overlapStart;
}

export const emptyAzureCache = (): AzureCache => ({ version: 1, lastSync: null, commits: {}, tips: {}, pullRequests: {} });
export const emptyGitHubCache = (): GitHubCache => ({ version: 1, lastSync: null, repos: {} });

const safeName = (name: string) => name.replace(/[^a-z0-9_-]/gi, '_');
export const azureCachePath = (org: string, dir = CACHE_DIR) => `${dir}/azure-${safeName(org)}.json`;
export const gitHubCachePath = (dir = CACHE_DIR) => `${dir}/github.json`;

export function readCache<T>(path: string, empty: () => T): T {
  if (!existsSync(path)) return empty();
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function writeCache(path: string, value: unknown, dir = CACHE_DIR): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(value));
}
