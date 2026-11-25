import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useContributions } from '../../hooks/useContributions';
import type { ContributionsFile } from '../../types/contributions';
import { Activity } from './Activity';

function Harness() {
  return <Activity query={useContributions('/data/contributions.json')} />;
}

function renderWithQuery() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
}

const file: ContributionsFile = {
  generatedAt: '2026-11-24T00:00:00Z',
  from: '2026-01-01',
  to: '2026-11-24',
  sample: true,
  days: { '2026-11-20': { work: 2, personal: 1 } },
  projects: {},
};

afterEach(() => vi.unstubAllGlobals());

describe('Activity', () => {
  it('loads the contributions file and labels sample data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(file), { headers: { 'Content-Type': 'application/json' } })));
    renderWithQuery();

    expect(screen.getByLabelText('Loading activity')).toBeInTheDocument();
    expect(await screen.findByText('Sample data.')).toBeInTheDocument();
    expect(document.querySelector('.heatmap__summary')).toHaveTextContent('3 commits in the last 12 months');
  });

  it('explains when the file can’t be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('missing', { status: 404 })));
    renderWithQuery();

    expect(await screen.findByRole('status')).toHaveTextContent('Activity data couldn’t be loaded (HTTP 404).');
  });
});
