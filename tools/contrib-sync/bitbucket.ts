// Bitbucket Cloud source: your commits in a workspace, read through the REST API (2.0).
// Same rules as Azure DevOps: your emails only, every branch, commits inside your merged pull
// requests (squash merges delete branches), Bitbucket's own "Merged in …" commits skipped, each
// commit once by SHA, unchanged branches skipped on later runs.
// Auth: an Atlassian API token with read scopes, used as Basic auth with your Atlassian email.

import type { AzureCache } from './cache.ts';
import { incrementalFromDate } from './cache.ts';
import type { Kind } from './config.ts';
import { HttpError, type HttpClient } from './http.ts';

const API = 'https://api.bitbucket.org/2.0';

export interface BitbucketConfig {
  /** The {workspace} in https://bitbucket.org/{workspace}. */
  workspace: string;
  /** Your Atlassian account email: the username for the API token. */
  username: string;
  /** Commits whose author email matches one of these (case-insensitive) are counted. */
  authorEmails: string[];
  /** Default 'work'. */
  kind?: Kind;
  /** Env var holding the API token. Default 'BITBUCKET_TOKEN'. */
  tokenEnv?: string;
}

interface Page<T> {
  values: T[];
  next?: string;
}

interface Repo {
  slug: string;
}

interface Branch {
  name: string;
  target: { hash: string };
}

export interface BitbucketCommit {
  hash: string;
  date: string;
  author: { raw?: string };
  message?: string;
}

/** Bitbucket writes "Merged in branch (pull request #12)" when a pull request is merged or squashed. */
export const isPullRequestMerge = (commit: BitbucketCommit) => /^Merged in .+\(pull request #\d+\)/.test(commit.message ?? '');

/** "Jane Doe <jane@x.com>" → "jane@x.com" */
export const authorEmail = (commit: BitbucketCommit) => /<([^>]+)>/.exec(commit.author.raw ?? '')?.[1]?.trim().toLowerCase();

async function allPages<T>(client: HttpClient, url: string, stop?: (page: T[]) => boolean): Promise<T[]> {
  const items: T[] = [];
  for (let next: string | undefined = url; next; ) {
    const page: Page<T> = (await client.getJson<Page<T>>(next)).body;
    items.push(...page.values);
    if (stop?.(page.values)) break;
    next = page.next;
  }
  return items;
}

/** Missing or empty repos/branches/pull requests answer 404; treat as nothing there. */
async function orNothing<T>(request: Promise<T[]>): Promise<T[]> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return [];
    throw error;
  }
}

const enc = encodeURIComponent;

export async function myUuid(client: HttpClient): Promise<string | null> {
  try {
    return (await client.getJson<{ uuid?: string }>(`${API}/user`)).body.uuid ?? null;
  } catch {
    return null;
  }
}

export const listRepos = (client: HttpClient, workspace: string) => allPages<Repo>(client, `${API}/repositories/${enc(workspace)}?pagelen=100`);

export const listBranches = (client: HttpClient, workspace: string, repo: string) =>
  orNothing(allPages<Branch>(client, `${API}/repositories/${enc(workspace)}/${enc(repo)}/refs/branches?pagelen=100`));

/** Newest first; stops paging once a page reaches commits older than `since`. */
export const listCommits = (client: HttpClient, workspace: string, repo: string, branch: string, since: string) =>
  orNothing(
    allPages<BitbucketCommit>(client, `${API}/repositories/${enc(workspace)}/${enc(repo)}/commits/${enc(branch)}?pagelen=100`, (page) =>
      page.some((c) => c.date < since),
    ),
  );

export const listMyMergedPullRequests = (client: HttpClient, workspace: string, repo: string, uuid: string) =>
  orNothing(
    allPages<{ id: number }>(
      client,
      `${API}/repositories/${enc(workspace)}/${enc(repo)}/pullrequests?state=MERGED&pagelen=50&q=${enc(`author.uuid="${uuid}"`)}`,
    ),
  );

export const listPullRequestCommits = (client: HttpClient, workspace: string, repo: string, id: number) =>
  orNothing(allPages<BitbucketCommit>(client, `${API}/repositories/${enc(workspace)}/${enc(repo)}/pullrequests/${id}/commits?pagelen=100`));

/** Returns the updated cache; the input cache is not modified. */
export async function syncBitbucketWorkspace(
  client: HttpClient,
  config: BitbucketConfig,
  previous: AzureCache,
  options: { configFrom: string; now: Date; log: { info(message: string): void } },
): Promise<AzureCache> {
  const cache: AzureCache = {
    version: 1,
    lastSync: options.now.toISOString(),
    commits: { ...previous.commits },
    tips: { ...previous.tips },
    pullRequests: { ...previous.pullRequests },
  };
  const emails = new Set(config.authorEmails.map((e) => e.trim().toLowerCase()));
  const earliest = `${options.configFrom}T00:00:00Z`;
  const since = incrementalFromDate(previous.lastSync, options.configFrom);

  const record = (commit: BitbucketCommit, repo: string): boolean => {
    const email = authorEmail(commit);
    if (!email || !emails.has(email) || isPullRequestMerge(commit) || cache.commits[commit.hash]) return false;
    if (new Date(commit.date).toISOString() < earliest) return false;
    cache.commits[commit.hash] = { at: commit.date, repo };
    return true;
  };

  const repos = await listRepos(client, config.workspace);
  const me = await myUuid(client);
  options.log.info(`${config.workspace} (Bitbucket): ${repos.length} repos`);

  for (const { slug } of repos) {
    let added = 0;
    for (const branch of await listBranches(client, config.workspace, slug)) {
      const tipKey = `${slug}:${branch.name}`;
      if (cache.tips[tipKey] === branch.target.hash) continue; // nothing new on this branch
      for (const commit of await listCommits(client, config.workspace, slug, branch.name, since)) {
        if (record(commit, slug)) added++;
      }
      cache.tips[tipKey] = branch.target.hash;
    }
    if (me) {
      for (const pr of await listMyMergedPullRequests(client, config.workspace, slug, me)) {
        const prKey = `${slug}:${pr.id}`;
        if (cache.pullRequests[prKey]) continue; // a merged pull request never changes
        for (const commit of await listPullRequestCommits(client, config.workspace, slug, pr.id)) {
          if (record(commit, slug)) added++;
        }
        cache.pullRequests[prKey] = true;
      }
    }
    if (added > 0) options.log.info(`  ${slug}: +${added}`);
  }
  return cache;
}
