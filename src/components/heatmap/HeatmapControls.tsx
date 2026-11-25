import type { Dispatch } from 'react';
import type { RangeOption } from './calendar';
import type { Filter, HeatmapAction } from './heatmapReducer';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
];

interface HeatmapControlsProps {
  range: RangeOption;
  years: number[];
  filter: Filter;
  dispatch: Dispatch<HeatmapAction>;
}

export function HeatmapControls({ range, years, filter, dispatch }: HeatmapControlsProps) {
  return (
    <div className="heatmap-controls">
      <div className="segmented" role="group" aria-label="Which commits to show">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className="segmented__option"
            aria-pressed={filter === value}
            onClick={() => dispatch({ type: 'setFilter', filter: value })}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="select">
        <span className="visually-hidden">Period</span>
        <select
          value={String(range)}
          onChange={(event) => {
            const value = event.target.value;
            dispatch({ type: 'setRange', range: value === 'last12' || value === 'last6' ? value : Number(value) });
          }}
        >
          <option value="last6">Last 6 months</option>
          <option value="last12">Last 12 months</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
