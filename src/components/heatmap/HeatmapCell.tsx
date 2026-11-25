import { memo, type Dispatch } from 'react';
import type { DayKey } from '../../types/contributions';
import type { HeatmapAction } from './heatmapReducer';
import type { Level } from './levels';

interface HeatmapCellProps {
  date: DayKey;
  x: number;
  y: number;
  size: number;
  level: Level;
  label: string;
  /** Interactive cells only: */
  dispatch?: Dispatch<HeatmapAction>;
  tabbable?: boolean;
  active?: boolean;
}

export const HeatmapCell = memo(function HeatmapCell({ date, x, y, size, level, label, dispatch, tabbable, active }: HeatmapCellProps) {
  const className = `heat-cell heat-${level}${active ? ' heat-cell--active' : ''}`;
  if (!dispatch) {
    return <rect className={className} x={x} y={y} width={size} height={size} rx={2} aria-hidden="true" />;
  }
  return (
    <rect
      className={className}
      x={x}
      y={y}
      width={size}
      height={size}
      rx={2}
      role="img"
      aria-label={label}
      data-date={date}
      tabIndex={tabbable ? 0 : -1}
      onPointerEnter={() => dispatch({ type: 'activate', date })}
      onFocus={() => dispatch({ type: 'activate', date, focus: true })}
    />
  );
});
