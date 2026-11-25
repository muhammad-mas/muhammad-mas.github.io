import { useQuery } from '@tanstack/react-query';
import type { ContributionsFile } from '../types/contributions';

const DEFAULT_URL = `${import.meta.env.BASE_URL}data/contributions.json`;

function isContributionsFile(value: unknown): value is ContributionsFile {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.from === 'string' && typeof v.to === 'string' && typeof v.days === 'object' && typeof v.projects === 'object';
}

export async function fetchContributions(url: string, signal?: AbortSignal): Promise<ContributionsFile> {
  const response = await fetch(url, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json: unknown = await response.json();
  if (!isContributionsFile(json)) throw new Error('Unexpected file shape');
  return json;
}

/** Loads public/data/contributions.json (written by `npm run sync`) through TanStack Query. */
export function useContributions(url = DEFAULT_URL) {
  return useQuery({
    queryKey: ['contributions', url],
    queryFn: ({ signal }) => fetchContributions(url, signal),
  });
}
