import { useCallback, useMemo, useReducer } from 'react';
import type { ContributionsFile, DayKey } from '../../types/contributions';
import { buildCalendar, rangeFor, yearsBetween } from './calendar';
import { countFor, monthlyRows, splitFor, totalsFor } from './counts';
import { commits, formatLongDate, formatNumber, formatShortDate } from './format';
import { HeatmapControls } from './HeatmapControls';
import { HeatmapGrid } from './HeatmapGrid';
import { HeatmapLegend } from './HeatmapLegend';
import { heatmapReducer, initialStateForScreen } from './heatmapReducer';
import { HeatmapTable } from './HeatmapTable';
import { HeatmapTooltip } from './HeatmapTooltip';
import { levelFor, levelRanges, thresholds } from './levels';
import { InfoTip } from '../cv/InfoTip';

const SOURCES_NOTE = 'Mapped from other platforms too (Azure DevOps), not just GitHub.';

export function Heatmap({ data }: { data: ContributionsFile }) {
  const [state, dispatch] = useReducer(heatmapReducer, undefined, initialStateForScreen);
  const { filter } = state;

  const range = useMemo(() => rangeFor(state.range, data.to), [state.range, data.to]);
  const calendar = useMemo(() => buildCalendar(range), [range]);
  const dates = useMemo(() => calendar.cells.map((c) => c.date), [calendar]);
  const counts = useMemo(
    () => new Map(dates.map((date) => [date, countFor(splitFor(data, date), filter)])),
    [dates, data, filter],
  );
  const limits = useMemo(() => thresholds([...counts.values()]), [counts]);
  const totals = useMemo(() => totalsFor(data, dates), [data, dates]);

  const levelOf = useCallback((date: DayKey) => levelFor(counts.get(date) ?? 0, limits), [counts, limits]);
  const labelOf = useCallback(
    (date: DayKey) => {
      const split = splitFor(data, date);
      const n = countFor(split, filter);
      const detail = filter === 'all' && n > 0 ? ` (${split.work} work, ${split.personal} personal)` : '';
      return `${formatLongDate(date)}: ${n === 0 ? 'no commits' : commits(n)}${detail}`;
    },
    [data, filter],
  );
  const renderTooltip = useCallback(
    (date: DayKey) => <HeatmapTooltip date={date} split={splitFor(data, date)} filter={filter} />,
    [data, filter],
  );

  const period = state.range === 'last12' ? 'the last 12 months' : state.range === 'last6' ? 'the last 6 months' : String(state.range);
  const shown = filter === 'work' ? totals.work : filter === 'personal' ? totals.personal : totals.total;
  const who = filter === 'all' ? '' : ` ${filter}`;

  return (
    <div className="heatmap card">
      <div className="heatmap__top">
        <div>
          <p className="heatmap__summary">
            <strong>{formatNumber(shown)}</strong>
            {who} {shown === 1 ? 'commit' : 'commits'} in {period}
            <InfoTip label="Where these commits come from" text={SOURCES_NOTE} />
          </p>
          {filter === 'all' && (
            <p className="heatmap__split">
              {formatNumber(totals.work)} work · {formatNumber(totals.personal)} personal · {formatNumber(totals.activeDays)} active days
            </p>
          )}
        </div>
        <HeatmapControls range={state.range} years={yearsBetween(data.from, data.to)} filter={filter} dispatch={dispatch} />
      </div>

      <HeatmapGrid
        calendar={calendar}
        levelOf={levelOf}
        labelOf={labelOf}
        ariaLabel={`Commits per day in ${period}. Use the arrow keys to move between days.`}
        interaction={{
          dispatch,
          focusDate: state.focusDate ?? range.end,
          activeDate: state.activeDate,
          start: range.start,
          end: range.end,
          renderTooltip,
        }}
      />

      <div className="heatmap__bottom">
        <p className="heatmap__updated">Updated {formatShortDate(data.to)}</p>
        <HeatmapLegend ranges={levelRanges(limits)} />
      </div>

      <HeatmapTable rows={monthlyRows(data, dates)} caption={`Commits per month in ${period}`} />
    </div>
  );
}
