// Tiny JSON HTTP client with retry on throttling. The auth header is never
// included in error messages, so tokens can't leak into logs.

export interface JsonResponse<T> {
  body: T;
  headers: Headers;
}

export interface HttpClient {
  getJson<T>(url: string): Promise<JsonResponse<T>>;
  postJson<T>(url: string, payload: unknown): Promise<JsonResponse<T>>;
}

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

interface ClientOptions {
  authorization: string;
  /** Shown in errors, e.g. 'Azure DevOps'. */
  service: string;
  fetchImpl?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
  extraHeaders?: Record<string, string>;
}

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

/** Strips query strings so error messages don't carry emails or filters. */
function safeUrl(url: string): string {
  return url.split('?')[0] ?? url;
}

export function createHttpClient(options: ClientOptions): HttpClient {
  const fetchImpl: FetchLike = options.fetchImpl ?? ((url, init) => fetch(url, init));
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const maxRetries = options.maxRetries ?? 4;

  async function send<T>(url: string, init: RequestInit): Promise<JsonResponse<T>> {
    for (let attempt = 0; ; attempt++) {
      const response = await fetchImpl(url, {
        ...init,
        headers: {
          Accept: 'application/json',
          Authorization: options.authorization,
          'User-Agent': 'contrib-sync',
          ...options.extraHeaders,
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });

      if (RETRY_STATUSES.has(response.status) && attempt < maxRetries) {
        const retryAfter = Number(response.headers.get('Retry-After'));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt);
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        throw new HttpError(response.status, `${options.service} refused the token (${response.status}) for ${safeUrl(url)}. Check it exists, hasn't expired and has read access.`);
      }
      if (!response.ok) {
        throw new HttpError(response.status, `${options.service} returned ${response.status} for ${safeUrl(url)}`);
      }

      // Azure DevOps answers a bad PAT with 203 + an HTML sign-in page instead of 401.
      const type = response.headers.get('Content-Type') ?? '';
      if (!type.includes('json')) {
        throw new HttpError(response.status, `${options.service} returned a non-JSON page for ${safeUrl(url)} — usually a wrong or expired token, or the wrong organization.`);
      }

      return { body: (await response.json()) as T, headers: response.headers };
    }
  }

  return {
    getJson: (url) => send(url, { method: 'GET' }),
    postJson: (url, payload) => send(url, { method: 'POST', body: JSON.stringify(payload) }),
  };
}
