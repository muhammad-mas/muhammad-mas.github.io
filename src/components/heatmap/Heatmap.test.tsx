import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ContributionsFile } from '../../types/contributions';
import { Heatmap } from './Heatmap';

const data: ContributionsFile = {
  generatedAt: '2026-11-24T12:00:00Z',
  from: '2025-01-01',
  to: '2026-11-24',
  days: {
    '2026-11-20': { work: 5, personal: 2 },
    '2026-11-24': { work: 0, personal: 3 },
    '2025-06-02': { work: 4, personal: 0 },
  },
  projects: {},
};

const summary = () => document.querySelector('.heatmap__summary');

describe('Heatmap', () => {
  it('summarises the last 12 months by default', () => {
    render(<Heatmap data={data} />);
    expect(summary()).toHaveTextContent('10 commits in the last 12 months');
    expect(screen.getByText(/active days/)).toHaveTextContent('5 work · 5 personal · 2 active days');
  });

  it('filters to work commits', async () => {
    render(<Heatmap data={data} />);
    const filters = screen.getByRole('group', { name: 'Which commits to show' });
    await userEvent.click(within(filters).getByRole('button', { name: 'Work' }));
    expect(within(filters).getByRole('button', { name: 'Work' })).toHaveAttribute('aria-pressed', 'true');
    expect(summary()).toHaveTextContent('5 work commits in the last 12 months');
  });

  it('switches to a calendar year', async () => {
    render(<Heatmap data={data} />);
    await userEvent.selectOptions(screen.getByLabelText('Period'), '2025');
    expect(summary()).toHaveTextContent('4 commits in 2025');
  });

  it('labels every day for screen readers and shows a tooltip on hover', () => {
    render(<Heatmap data={data} />);
    const cell = screen.getByRole('img', { name: 'Fri 20 Nov 2026: 7 commits (5 work, 2 personal)' });
    fireEvent.pointerEnter(cell);
    expect(document.querySelector('.heatmap-tooltip')).toHaveTextContent('7 commits5 work · 2 personalFri 20 Nov 2026');
  });

  it('moves between days with the arrow keys (one tab stop)', async () => {
    render(<Heatmap data={data} />);
    const tabbable = document.querySelectorAll('rect[tabindex="0"]');
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAttribute('data-date', '2026-11-24');

    await userEvent.tab(); // filter buttons and select come first
    while (document.activeElement?.tagName.toLowerCase() !== 'rect') await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toHaveAttribute('data-date', '2026-11-17');
  });

  it('offers the data as a table', () => {
    render(<Heatmap data={data} />);
    const row = screen.getByRole('row', { name: /Nov 2026/ });
    expect(row).toHaveTextContent('Nov 20265510');
  });
});
