// Azure DevOps source: reads commit ids + author dates from every repo you can
// read in an organization, keeping only commits authored by your emails.
// REST docs: https://learn.microsoft.com/rest/api/azure/devops/git/

import { incrementalFromDate, type AzureCache } from './cache.ts';
export { incrementalFromDate } from './cache.ts';
import type { AzureOrgConfig } from './config.ts';
import type { HttpClient } from './http.ts';

const API = 'api-version=7.1';
const PAGE_SIZE = 1000;

interface ListResponse<T> {
  value: T[];
  count?: number;
}

export interface AzureRepo {
  id: string;
  name: string;
  isDisabled?: boolean;
  defaultBranch?: string;
  project: { name: string };
}

interface AzureRef {
  name: string; // refs/heads/main
  objectId: string;
}

export interface AzureCommit {
  commitId: string;
  author: { name?: string; email?: string; date: string };
  /** The (possibly shortened) commit message. */
  comment?: string;
}

const base = (org: string) => `https://dev.azure.com/${encodeURIComponent(org)}`;

export function basicAuth(pat: string): string {
  return `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
}

export async function listRepositories(client: HttpClient, org: string): Promise<AzureRepo[]> {
  const { body } = await client.getJson<ListResponse<AzureRepo>>(`${base(org)}/_apis/git/repositories?${API}`);
  return body.value;
}

export async function listBranches(client: HttpClient, org: string, repo: AzureRepo): Promise<AzureRef[]> {
  const refs: AzureRef[] = [];
  let continuation: string | null = null;
  do {
    const token: string = continuation ? `&continuationToken=${encodeURIComponent(continuation)}` : '';
    const url = `${base(org)}/${encodeURIComponent(repo.project.name)}/_apis/git/repositories/${repo.id}/refs?filter=heads/&$top=1000${token}&${API}`;
    const { body, headers } = await client.getJson<ListResponse<AzureRef>>(url);
    refs.push(...body.value);
    continuation = headers.get('x-ms-continuationtoken');
  } while (continuation);
  return refs;
}

export async function listCommits(
  client: HttpClient,
  org: string,
  repo: AzureRepo,
  branch: string,
  fromDate: string,
): Promise<AzureCommit[]> {
  const commits: AzureCommit[] = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const query = [
      `searchCriteria.fromDate=${encodeURIComponent(fromDate)}`,
      `searchCriteria.itemVersion.version=${encodeURIComponent(branch)}`,
      'searchCriteria.itemVersion.versionType=branch',
      `searchCriteria.$top=${PAGE_SIZE}`,
      `searchCriteria.$skip=${skip}`,
      API,
    ].join('&');
    const url = `${base(org)}/${encodeURIComponent(repo.project.name)}/_apis/git/repositories/${repo.id}/commits?${query}`;
    const { body } = await client.getJson<ListResponse<AzureCommit>>(url);
    commits.push(...body.value);
    if (body.value.length < PAGE_SIZE) return commits;
  }
}

const branchName = (ref: string) => ref.replace(/^refs\/heads\//, '');

export interface SyncLog {
  info(message: string): void;
}

/**
 * Azure DevOps writes "Merged PR 123: …" when someone completes a pull request (merge or squash).
 * That's a click by whoever completed it, not new work: the pull request's own commits are
 * counted instead.
 */
export const isPullRequestMerge = (commit: AzureCommit) => /^Merged PR \d+/.test(commit.comment ?? '');

interface PullRequest {
  pullRequestId: number;
}

/** The id of the person the token belongs to, or null if the org won't say. */
export async function myIdentityId(client: HttpClient, org: string): Promise<string | null> {
  try {
    const { body } = await client.getJson<{ authenticatedUser?: { id?: string } }>(`${base(org)}/_apis/connectionData`);
    return body.authenticatedUser?.id ?? null;
  } catch {
    return null;
  }
}

/** Your completed pull requests in a repo. */
export async function listMyCompletedPullRequests(client: HttpClient, org: string, repo: AzureRepo, creatorId: string): Promise<PullRequest[]> {
  const prs: PullRequest[] = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const query = [
      `searchCriteria.creatorId=${encodeURIComponent(creatorId)}`,
      'searchCriteria.status=completed',
      `$top=${PAGE_SIZE}`,
      `$skip=${skip}`,
      API,
    ].join('&');
    const url = `${base(org)}/${encodeURIComponent(repo.project.name)}/_apis/git/repositories/${repo.id}/pullrequests?${query}`;
    const { body } = await client.getJson<ListResponse<PullRequest>>(url);
    prs.push(...body.value);
    if (body.value.length < PAGE_SIZE) return prs;
  }
}

/**
 * The commits inside a pull request. Azure DevOps keeps them after a squash merge deletes the
 * source branch, so this is the only place that work can still be found.
 */
export async function listPullRequestCommits(client: HttpClient, org: string, repo: AzureRepo, pullRequestId: number): Promise<AzureCommit[]> {
  const commits: AzureCommit[] = [];
  let continuation: string | null = null;
  do {
    const token: string = continuation ? `&continuationToken=${encodeURIComponent(continuation)}` : '';
    const url = `${base(org)}/${encodeURIComponent(repo.project.name)}/_apis/git/repositories/${repo.id}/pullRequests/${pullRequestId}/commits?$top=${PAGE_SIZE}${token}&${API}`;
    const { body, headers } = await client.getJson<ListResponse<AzureCommit>>(url);
    commits.push(...body.value);
    continuation = headers.get('x-ms-continuationtoken');
  } while (continuation);
  return commits;
}

/** Returns the updated cache; the input cache is not modified. */
export async function syncAzureOrg(
  client: HttpClient,
  org: AzureOrgConfig,
  previous: AzureCache,
  options: { configFrom: string; now: Date; log: SyncLog },
): Promise<AzureCache> {
  const cache: AzureCache = {
    version: 1,
    lastSync: options.now.toISOString(),
    commits: { ...previous.commits },
    tips: { ...previous.tips },
    pullRequests: { ...previous.pullRequests },
  };
  const emails = new Set(org.authorEmails.map((e) => e.trim().toLowerCase()));
  const projectFilter = org.projects?.length ? new Set(org.projects.map((p) => p.toLowerCase())) : null;
  const fromDate = incrementalFromDate(previous.lastSync, options.configFrom);
  const earliest = `${options.configFrom}T00:00:00Z`;

  /** Keeps a commit if it's yours, real work and not seen before. Returns true when added. */
  const record = (commit: AzureCommit, repoLabel: string): boolean => {
    const email = commit.author.email?.toLowerCase();
    if (!email || !emails.has(email) || isPullRequestMerge(commit) || cache.commits[commit.commitId]) return false;
    if (new Date(commit.author.date).toISOString() < earliest) return false;
    cache.commits[commit.commitId] = { at: commit.author.date, repo: repoLabel };
    return true;
  };

  const repos = (await listRepositories(client, org.organization)).filter(
    (repo) => !repo.isDisabled && repo.defaultBranch && (!projectFilter || projectFilter.has(repo.project.name.toLowerCase())),
  );
  const me = await myIdentityId(client, org.organization);
  options.log.info(`${org.organization}: ${repos.length} repos`);

  for (const repo of repos) {
    const label = `${repo.project.name}/${repo.name}`;
    let added = 0;

    // 1. Commits on today's branches.
    const refs = await listBranches(client, org.organization, repo);
    const wanted = org.allBranches === false ? refs.filter((r) => r.name === repo.defaultBranch) : refs;
    for (const ref of wanted) {
      const tipKey = `${repo.id}:${ref.name}`;
      if (cache.tips[tipKey] === ref.objectId) continue; // nothing new on this branch
      for (const commit of await listCommits(client, org.organization, repo, branchName(ref.name), fromDate)) {
        if (record(commit, label)) added++;
      }
      cache.tips[tipKey] = ref.objectId;
    }

    // 2. Commits inside your completed pull requests (squash merges delete their branches).
    if (me) {
      for (const pr of await listMyCompletedPullRequests(client, org.organization, repo, me)) {
        const prKey = `${repo.id}:${pr.pullRequestId}`;
        if (cache.pullRequests[prKey]) continue; // a completed pull request never changes
        for (const commit of await listPullRequestCommits(client, org.organization, repo, pr.pullRequestId)) {
          if (record(commit, label)) added++;
        }
        cache.pullRequests[prKey] = true;
      }
    }

    if (added > 0) options.log.info(`  ${label}: +${added}`);
  }
  return cache;
}
