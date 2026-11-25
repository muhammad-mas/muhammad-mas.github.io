// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { authorEmail, isPullRequestMerge, syncBitbucketWorkspace, type BitbucketCommit } from './bitbucket.ts';
import { emptyAzureCache } from './cache.ts';
import { HttpError, type HttpClient } from './http.ts';

const commit = (hash: string, email: string, date: string, message = 'work'): BitbucketCommit => ({
  hash,
  date,
  author: { raw: `Muhammad Arslan <${email}>` },
  message,
});

/** Fake Bitbucket: one repo with two branches (paged commits), one merged PR, one empty repo. */
function fakeBitbucket() {
  const urls: string[] = [];
  const client: HttpClient = {
    async getJson<T>(url: string) {
      urls.push(url);
      const reply = (body: unknown) => ({ body: body as T, headers: new Headers() });
      if (url.endsWith('/2.0/user')) return reply({ uuid: '{me}' });
      if (url.includes('/repositories/paramet?')) return reply({ values: [{ slug: 'quotes' }, { slug: 'empty' }] });
      if (url.includes('/empty/')) throw new HttpError(404, 'Repository is empty');
      if (url.includes('/refs/branches')) return reply({ values: [{ name: 'main', target: { hash: 't1' } }, { name: 'feature/x', target: { hash: 't2' } }] });
      if (url.includes('/commits/main') && !url.includes('page=2')) {
        return reply({
          values: [commit('m1', 'me@home.example', '2026-07-14T23:30:00Z'), commit('merge', 'me@work.example', '2026-07-14T10:00:00Z', 'Merged in feature/x (pull request #7)')],
          next: 'https://api.bitbucket.org/2.0/repositories/paramet/quotes/commits/main?page=2',
        });
      }
      if (url.includes('page=2')) return reply({ values: [commit('old', 'me@work.example', '2023-01-01T00:00:00Z')] });
      if (url.includes('/commits/feature%2Fx')) return reply({ values: [commit('m1', 'me@home.example', '2026-07-14T23:30:00Z'), commit('other', 'someone@else.com', '2026-07-15T09:00:00Z')] });
      if (url.includes('/pullrequests?')) {
        expect(decodeURIComponent(url)).toContain('author.uuid="{me}"');
        return reply({ values: [{ id: 7 }] });
      }
      if (url.includes('/pullrequests/7/commits')) return reply({ values: [commit('p1', 'ME@WORK.EXAMPLE', '2026-07-12T09:00:00Z')] });
      throw new Error(`unexpected ${url}`);
    },
    async postJson() {
      throw new Error('not used');
    },
  };
  return { client, urls };
}

const config = { workspace: 'paramet', username: 'me@x.com', authorEmails: ['me@work.example', 'me@home.example'] };
const options = { configFrom: '2023-08-01', now: new Date('2026-11-26T12:00:00Z'), log: { info: () => {} } };

describe('syncBitbucketWorkspace', () => {
  it('counts my commits under either email, once per SHA, plus merged PR commits; skips merge commits and old ones', async () => {
    const { client } = fakeBitbucket();
    const cache = await syncBitbucketWorkspace(client, config, emptyAzureCache(), options);
    expect(Object.keys(cache.commits).sort()).toEqual(['m1', 'p1']);
    expect(cache.pullRequests).toEqual({ 'quotes:7': true });
    expect(cache.tips).toEqual({ 'quotes:main': 't1', 'quotes:feature/x': 't2' });
  });

  it('skips unchanged branches and already-read pull requests next time', async () => {
    const { client, urls } = fakeBitbucket();
    const first = await syncBitbucketWorkspace(client, config, emptyAzureCache(), options);
    urls.length = 0;
    await syncBitbucketWorkspace(client, config, first, options);
    expect(urls.some((u) => u.includes('/commits/'))).toBe(false);
  });
});

describe('helpers', () => {
  it('reads the email from the raw author and spots merge commits', () => {
    expect(authorEmail(commit('a', 'Me@X.com', '2026-01-01T00:00:00Z'))).toBe('me@x.com');
    expect(isPullRequestMerge(commit('a', 'x@y', '', 'Merged in feature/abc (pull request #12)\n\nSquashed'))).toBe(true);
    expect(isPullRequestMerge(commit('a', 'x@y', '', 'Fix the merge logic'))).toBe(false);
  });
});
