import { useMemo } from 'react';
import type { DayKey } from '../../types/contributions';
import { buildCalendar, rangeFor } from '../heatmap/calendar';
import { commits } from '../heatmap/format';
import { HeatmapGrid } from '../heatmap/HeatmapGrid';
import { levelFor, thresholds } from '../heatmap/levels';

/** A small, read-only heatmap of one project's commits over the last 12 months. */
export function ProjectActivity({ days, lastSynced }: { days: Record<DayKey, number>; lastSynced: DayKey }) {
  const calendar = useMemo(() => buildCalendar(rangeFor('last12', lastSynced)), [lastSynced]);
  const counts = calendar.cells.map((c) => days[c.date] ?? 0);
  const limits = thresholds(counts);
  const total = counts.reduce((sum, n) => sum + n, 0);
  const label = `${commits(total)} in the last 12 months`;

  return (
    <div className="project-activity">
      <HeatmapGrid
        calendar={calendar}
        size="small"
        levelOf={(date) => levelFor(days[date] ?? 0, limits)}
        labelOf={() => ''}
        ariaLabel={`${label}, shown as a heatmap`}
      />
      <p className="project-activity__total">{label}</p>
    </div>
  );
}
