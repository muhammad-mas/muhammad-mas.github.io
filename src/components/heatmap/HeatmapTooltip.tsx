import type { DayKey, DaySplit } from '../../types/contributions';
import { countFor } from './counts';
import { commits, formatLongDate, formatNumber } from './format';
import type { Filter } from './heatmapReducer';

export function HeatmapTooltip({ date, split, filter }: { date: DayKey; split: DaySplit; filter: Filter }) {
  const total = countFor(split, filter);
  return (
    <>
      <strong className="heatmap-tooltip__value">{total === 0 ? 'No commits' : commits(total)}</strong>
      {filter === 'all' && total > 0 && (
        <span className="heatmap-tooltip__split">
          {formatNumber(split.work)} work · {formatNumber(split.personal)} personal
        </span>
      )}
      <span className="heatmap-tooltip__date">{formatLongDate(date)}</span>
    </>
  );
}
