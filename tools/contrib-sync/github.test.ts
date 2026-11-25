// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { nextPage, syncGitHub } from './github.ts';
import { HttpError, type HttpClient } from './http.ts';

const commit = (sha: string, date: string) => ({ sha, commit: { author: { date } } });

/** A fake GitHub API: one repo with two branches sharing a commit, one empty repo, paged commits. */
function fakeGitHub() {
  const urls: string[] = [];
  const client: HttpClient = {
    async getJson<T>(url: string) {
      urls.push(url);
      const headers = new Headers();
      const reply = (body: unknown) => ({ body: body as T, headers });

      if (url.includes('/user/repos')) return reply([{ full_name: 'me/paperwork' }, { full_name: 'me/empty' }]);
      if (url.includes('/repos/me/empty/')) throw new HttpError(409, 'Git Repository is empty.');
      if (url.includes('/branches')) return reply([{ name: 'main' }, { name: 'feature/x' }]);
      if (url.includes('sha=main') && !url.includes('page=2')) {
        headers.set('Link', '<https://api.github.com/repos/me/paperwork/commits?sha=main&page=2>; rel="next", <...>; rel="last"');
        return reply([commit('a', '2026-07-14T23:30:00Z'), commit('b', '2026-07-15T10:00:00Z')]);
      }
      if (url.includes('page=2')) return reply([commit('c', '2026-07-16T10:00:00Z')]);
      if (url.includes('sha=feature%2Fx')) return reply([commit('b', '2026-07-15T10:00:00Z'), commit('d', '2026-07-16T12:00:00Z')]);
      throw new Error(`unexpected ${url}`);
    },
    async postJson() {
      throw new Error('not used');
    },
  };
  return { client, urls };
}

describe('syncGitHub', () => {
  it('counts my commits on every branch once, by London day, following pages and skipping empty repos', async () => {
    const { client, urls } = fakeGitHub();
    const cache = await syncGitHub(client, {
      login: 'muhammad-mas',
      fromDay: '2024-01-01',
      toDay: '2026-11-25',
      timeZone: 'Europe/London',
      now: new Date('2026-11-25T00:00:00Z'),
    });

    // a: 23:30 UTC in July is 00:30 BST on the 15th. b appears on both branches but counts once.
    expect(cache.repos).toEqual({ 'me/paperwork': { '2026-07-15': 2, '2026-07-16': 2 } });
    expect(urls.some((u) => u.includes('author=muhammad-mas') && u.includes('since=2024-01-01T00%3A00%3A00Z'))).toBe(true);
  });

  it('passes other errors on', async () => {
    const client: HttpClient = {
      async getJson() {
        throw new HttpError(401, 'GitHub refused the token');
      },
      async postJson() {
        throw new Error('not used');
      },
    };
    await expect(
      syncGitHub(client, { login: 'x', fromDay: '2026-01-01', toDay: '2026-01-02', timeZone: 'UTC', now: new Date() }),
    ).rejects.toThrow('refused the token');
  });

  it('uses the last sync date while preserving history and deduplicating overlapping results', async () => {
    const { client, urls } = fakeGitHub();
    const options = {
      login: 'muhammad-mas',
      fromDay: '2024-01-01',
      toDay: '2026-11-25',
      timeZone: 'Europe/London',
      now: new Date('2026-11-25T00:00:00Z'),
    };
    const first = await syncGitHub(client, options, {
      version: 1,
      lastSync: '2026-11-24T00:00:00Z',
      repos: {},
    });
    expect(urls.some((url) => url.includes('since=2024-01-01T00%3A00%3A00Z'))).toBe(true);

    urls.length = 0;
    const next = await syncGitHub(client, { ...options, now: new Date('2026-11-25T12:00:00Z') }, first);
    expect(urls.filter((url) => url.includes('since=2026-10-26T00%3A00%3A00.000Z'))).toHaveLength(2);
    expect(next.repos).toEqual(first.repos);
    expect(next.lastSync).toBe('2026-11-25T12:00:00.000Z');
  });
});

describe('nextPage', () => {
  it('reads the next link, or null on the last page', () => {
    expect(nextPage('<https://api.github.com/x?page=2>; rel="next", <https://api.github.com/x?page=5>; rel="last"')).toBe('https://api.github.com/x?page=2');
    expect(nextPage('<https://api.github.com/x?page=1>; rel="prev"')).toBeNull();
    expect(nextPage(null)).toBeNull();
  });
});
