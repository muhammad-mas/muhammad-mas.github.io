// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createHttpClient } from './http.ts';

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

describe('createHttpClient', () => {
  it('retries throttled requests, honouring Retry-After', async () => {
    const waits: number[] = [];
    const responses = [json({}, 429, { 'Retry-After': '2' }), json({ ok: true })];
    const client = createHttpClient({
      authorization: 'Basic secret',
      service: 'Test',
      fetchImpl: async () => responses.shift()!,
      sleep: async (ms) => {
        waits.push(ms);
      },
    });

    const { body } = await client.getJson<{ ok: boolean }>('https://example.test/a');
    expect(body.ok).toBe(true);
    expect(waits).toEqual([2000]);
  });

  it('treats an HTML sign-in page as a token problem, without leaking the token or query', async () => {
    const client = createHttpClient({
      authorization: 'Basic secret-token',
      service: 'Azure DevOps',
      fetchImpl: async () => new Response('<html>Sign in</html>', { status: 203, headers: { 'Content-Type': 'text/html' } }),
    });

    const error = await client.getJson('https://dev.azure.com/org/_apis/x?searchCriteria.author=me@work.com').catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/token/);
    expect((error as Error).message).not.toMatch(/secret-token|me@work\.com/);
  });

  it('explains 401s', async () => {
    const client = createHttpClient({ authorization: 'x', service: 'GitHub', fetchImpl: async () => json({}, 401) });
    await expect(client.postJson('https://api.github.com/graphql', {})).rejects.toThrow(/refused the token/);
  });
});
