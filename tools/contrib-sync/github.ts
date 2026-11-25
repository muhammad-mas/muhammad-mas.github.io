// GitHub source: your commits, read repo by repo through the REST API.
//
// Why not GitHub's contribution graph (GraphQL contributionsCollection)? With a fine-grained
// read-only token it reports private-repo commits only as an anonymous "restricted" total, so
// private projects (e.g. Paperwork Brain) would show as zero. Listing commits per repo works with
// a read-only token, and also lets us count every branch, the same as the Azure DevOps source.

import type { DayKey } from '../../src/types/contributions.ts';
import { toLocalDay } from './aggregate.ts';
import { incrementalFromDate, type GitHubCache } from './cache.ts';
import { HttpError, type HttpClient } from './http.ts';

const API = 'https://api.github.com';

interface Repo {
  full_name: string;
}

interface Branch {
  name: string;
}

interface Commit {
  sha: string;
  commit: { author: { date: string } | null };
}

/** The URL of the next page from a GitHub `Link` header, if any. */
export function nextPage(link: string | null): string | null {
  const match = link?.split(',').find((part) => part.includes('rel="next"'))?.match(/<([^>]+)>/);
  return match?.[1] ?? null;
}

async function allPages<T>(client: HttpClient, firstUrl: string): Promise<T[]> {
  const items: T[] = [];
  for (let url: string | null = firstUrl; url; ) {
    const { body, headers } = await client.getJson<T[]>(url);
    items.push(...body);
    url = nextPage(headers.get('Link'));
  }
  return items;
}

/** An empty repository answers 409; treat it as having nothing in it. */
async function orEmpty<T>(request: Promise<T[]>): Promise<T[]> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof HttpError && error.status === 409) return [];
    throw error;
  }
}

/** Repos the token can read that you own or collaborate on. */
export const listRepos = (client: HttpClient) =>
  allPages<Repo>(client, `${API}/user/repos?per_page=100&affiliation=owner,collaborator`);

export const listBranches = (client: HttpClient, repo: string) =>
  orEmpty(allPages<Branch>(client, `${API}/repos/${repo}/branches?per_page=100`));

export const listCommits = (client: HttpClient, repo: string, branch: string, login: string, since: string) =>
  orEmpty(
    allPages<Commit>(
      client,
      `${API}/repos/${repo}/commits?sha=${encodeURIComponent(branch)}&author=${encodeURIComponent(login)}&since=${encodeURIComponent(since)}&per_page=100`,
    ),
  );

/**
 * Refresh known branches from the last sync, and backfill newly discovered branches.
 * Keep one entry per SHA so overlapping windows and branches cannot double-count it.
 */
export async function syncGitHub(
  client: HttpClient,
  options: { login: string; fromDay: DayKey; toDay: DayKey; timeZone: string; now: Date; log?: { info(message: string): void } },
  previous?: GitHubCache,
): Promise<GitHubCache> {
  const { login, fromDay, timeZone } = options;
  const history: NonNullable<GitHubCache['history']> = { login, fromDay, timeZone, repos: {} };
  const cache: GitHubCache = { version: 1, lastSync: options.now.toISOString(), repos: {}, history };
  const saved = previous?.history;
  const compatible = saved?.login === login && saved.fromDay === fromDay && saved.timeZone === timeZone;
  const lastSync = compatible ? previous?.lastSync ?? null : null;
  const earliest = incrementalFromDate(null, fromDay);
  const incrementalSince = incrementalFromDate(lastSync, fromDay);
  options.log?.info(`GitHub: fetching known branches since ${incrementalSince}`);

  for (const repo of await listRepos(client)) {
    const prior = lastSync ? saved?.repos[repo.full_name] : undefined;
    const commits = { ...prior?.commits };
    const days: Record<DayKey, number> = {};
    const branches = (await listBranches(client, repo.full_name)).map(({ name }) => name);
    for (const branch of branches) {
      const since = prior?.branches.includes(branch) ? incrementalSince : earliest;
      for (const commit of await listCommits(client, repo.full_name, branch, login, since)) {
        const date = commit.commit.author?.date;
        if (!date || commits[commit.sha]) continue;
        const day = toLocalDay(date, timeZone);
        if (day >= fromDay) commits[commit.sha] = day;
      }
    }
    for (const day of Object.values(commits)) {
      if (day <= options.toDay) days[day] = (days[day] ?? 0) + 1;
    }
    history.repos[repo.full_name] = { branches, commits };
    if (Object.keys(days).length > 0) {
      cache.repos[repo.full_name] = days;
      options.log?.info(`  ${repo.full_name}: ${Object.keys(commits).length}`);
    }
  }
  return cache;
}
