import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { MonthRow } from './counts';
import { HeatmapTable } from './HeatmapTable';

const rows: MonthRow[] = [
  { month: '2026-09-01', work: 40, personal: 2 },
  { month: '2026-10-01', work: 10, personal: 30 },
  { month: '2026-11-01', work: 25, personal: 5 },
];

const monthColumn = () => screen.getAllByRole('row').slice(1).map((row) => within(row).getByRole('rowheader').textContent);
const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(`^${name}`) });

describe('HeatmapTable (TanStack Table)', () => {
  it('starts with the newest month first', () => {
    render(<HeatmapTable rows={rows} caption="Commits per month" />);
    expect(monthColumn()).toEqual(['Nov 2026', 'Oct 2026', 'Sep 2026']);
    expect(header('Month')).toHaveAttribute('aria-sort', 'descending');
    expect(header('Total')).toHaveAttribute('aria-sort', 'none');
  });

  it('sorts a number column biggest first, then flips on a second click', async () => {
    render(<HeatmapTable rows={rows} caption="Commits per month" />);
    await userEvent.click(screen.getByRole('button', { name: /^Personal/ }));
    expect(monthColumn()).toEqual(['Oct 2026', 'Nov 2026', 'Sep 2026']);
    expect(header('Personal')).toHaveAttribute('aria-sort', 'descending');
    expect(header('Month')).toHaveAttribute('aria-sort', 'none');

    await userEvent.click(screen.getByRole('button', { name: /^Personal/ }));
    expect(monthColumn()).toEqual(['Sep 2026', 'Nov 2026', 'Oct 2026']);
    expect(header('Personal')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('sorts by the computed total', async () => {
    render(<HeatmapTable rows={rows} caption="Commits per month" />);
    await userEvent.click(screen.getByRole('button', { name: /^Total/ }));
    expect(monthColumn()).toEqual(['Sep 2026', 'Oct 2026', 'Nov 2026']); // 42, 40, 30
    expect(within(screen.getAllByRole('row')[1]!).getAllByRole('cell').map((c) => c.textContent)).toEqual(['40', '2', '42']);
  });
});
