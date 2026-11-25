// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { basicAuth, incrementalFromDate, syncAzureOrg, type AzureCommit } from './azureDevOps.ts';
import { emptyAzureCache } from './cache.ts';
import type { HttpClient } from './http.ts';

const repo = { id: 'r1', name: 'Quotes', defaultBranch: 'refs/heads/main', project: { name: 'Sales Tools' } };

function commit(id: string, email: string, date = '2026-11-10T09:00:00Z'): AzureCommit {
  return { commitId: id, author: { email, date, name: 'x' } };
}

/** Fake Azure DevOps: branches with commits, and optionally your completed pull requests. */
function fakeClient(tips: Record<string, string>, commitsByBranch: Record<string, AzureCommit[]>, pullRequests?: Record<number, AzureCommit[]>) {
  const calls: string[] = [];
  const client: HttpClient = {
    async getJson<T>(url: string) {
      calls.push(url);
      const headers = new Headers();
      if (url.includes('/_apis/connectionData')) return { body: (pullRequests ? { authenticatedUser: { id: 'me-id' } } : {}) as T, headers };
      const prCommits = /pullRequests\/(\d+)\/commits/.exec(url);
      if (prCommits) return { body: { value: pullRequests?.[Number(prCommits[1])] ?? [] } as T, headers };
      if (url.includes('/pullrequests?')) {
        expect(url).toContain('searchCriteria.creatorId=me-id');
        return { body: { value: Object.keys(pullRequests ?? {}).map((id) => ({ pullRequestId: Number(id) })) } as T, headers };
      }
      if (url.includes('/_apis/git/repositories?')) return { body: { value: [repo, { ...repo, id: 'empty', defaultBranch: undefined }] } as T, headers };
      if (url.includes('/refs?')) {
        return { body: { value: Object.entries(tips).map(([name, objectId]) => ({ name: `refs/heads/${name}`, objectId })) } as T, headers };
      }
      const branch = decodeURIComponent(/itemVersion\.version=([^&]+)/.exec(url)?.[1] ?? '');
      return { body: { value: commitsByBranch[branch] ?? [] } as T, headers };
    },
    async postJson() {
      throw new Error('not used');
    },
  };
  return { client, calls };
}

const options = { configFrom: '2024-01-01', now: new Date('2026-11-24T12:00:00Z'), log: { info: () => {} } };
const org = { organization: 'my org', authorEmails: ['Me@Work.com'] };

describe('syncAzureOrg', () => {
  it('keeps only my commits, once per SHA across branches, and skips repos with no default branch', async () => {
    const { client, calls } = fakeClient(
      { main: 't1', 'feature/x': 't2' },
      {
        main: [commit('c1', 'me@work.com'), commit('c2', 'someone@work.com')],
        'feature/x': [commit('c1', 'me@work.com'), commit('c3', 'ME@work.com')],
      },
    );

    const cache = await syncAzureOrg(client, org, emptyAzureCache(), options);

    expect(Object.keys(cache.commits).sort()).toEqual(['c1', 'c3']);
    expect(cache.commits.c1).toEqual({ at: '2026-11-10T09:00:00Z', repo: 'Sales Tools/Quotes' });
    expect(cache.tips).toEqual({ 'r1:refs/heads/main': 't1', 'r1:refs/heads/feature/x': 't2' });
    expect(cache.lastSync).toBe('2026-11-24T12:00:00.000Z');
    // URL-encodes org, project and branch names.
    expect(calls.some((u) => u.startsWith('https://dev.azure.com/my%20org/Sales%20Tools/'))).toBe(true);
    expect(calls.some((u) => u.includes('itemVersion.version=feature%2Fx'))).toBe(true);
    expect(calls.some((u) => u.includes('/empty/'))).toBe(false);
  });

  it('skips branches whose tip has not moved since the last sync', async () => {
    const { client, calls } = fakeClient({ main: 't1', dev: 't9' }, { dev: [commit('c4', 'me@work.com')] });
    const previous = { ...emptyAzureCache(), lastSync: '2026-11-20T00:00:00Z', tips: { 'r1:refs/heads/main': 't1' } };

    const cache = await syncAzureOrg(client, org, previous, options);

    expect(calls.filter((u) => u.includes('/commits?')).length).toBe(1);
    expect(Object.keys(cache.commits)).toEqual(['c4']);
  });

  it('reads only the default branch when allBranches is false', async () => {
    const { client, calls } = fakeClient({ main: 't1', dev: 't2' }, {});
    await syncAzureOrg(client, { ...org, allBranches: false }, emptyAzureCache(), options);
    expect(calls.filter((u) => u.includes('/commits?')).map((u) => /version=([^&]+)/.exec(u)?.[1])).toEqual(['main']);
  });
});

describe('pull requests and merge commits', () => {
  it('recovers commits from squash-merged pull requests and skips the "Merged PR" commit', async () => {
    const squash = { ...commit('s1', 'me@work.com', '2024-05-02T10:00:00Z'), comment: 'Merged PR 42: Add pricing' };
    const { client, calls } = fakeClient(
      { main: 't1' },
      { main: [squash, commit('direct', 'me@work.com', '2024-05-03T10:00:00Z')] },
      // PR 42's own commits: its branch was deleted, so they're only reachable through the PR.
      { 42: [commit('p1', 'me@work.com', '2024-04-30T09:00:00Z'), commit('p2', 'ME@work.com', '2024-05-01T09:00:00Z'), commit('old', 'me@work.com', '2023-12-01T09:00:00Z')] },
    );

    const cache = await syncAzureOrg(client, org, emptyAzureCache(), options);

    expect(Object.keys(cache.commits).sort()).toEqual(['direct', 'p1', 'p2']); // no squash commit, nothing before configFrom
    expect(cache.pullRequests).toEqual({ 'r1:42': true });

    // A completed pull request never changes, so the next sync doesn't read it again.
    calls.length = 0;
    await syncAzureOrg(client, org, cache, options);
    expect(calls.some((u) => u.includes('/pullRequests/42/commits'))).toBe(false);
  });

  it('carries on without pull requests when the org does not say who you are', async () => {
    const { client, calls } = fakeClient({ main: 't1' }, { main: [commit('c1', 'me@work.com')] });
    const cache = await syncAzureOrg(client, org, emptyAzureCache(), options);
    expect(Object.keys(cache.commits)).toEqual(['c1']);
    expect(calls.some((u) => u.includes('/pullrequests?'))).toBe(false);
  });
});

describe('incrementalFromDate', () => {
  it('starts at the configured day on the first run', () => {
    expect(incrementalFromDate(null, '2024-01-01')).toBe('2024-01-01T00:00:00Z');
  });

  it('re-reads 30 days before the last sync, but never before the configured day', () => {
    expect(incrementalFromDate('2026-11-24T00:00:00.000Z', '2024-01-01')).toBe('2026-10-25T00:00:00.000Z');
    expect(incrementalFromDate('2024-01-10T00:00:00.000Z', '2024-01-01')).toBe('2024-01-01T00:00:00Z');
  });
});

describe('basicAuth', () => {
  it('encodes an empty user name and the PAT', () => {
    expect(basicAuth('abc')).toBe(`Basic ${Buffer.from(':abc').toString('base64')}`);
  });
});
