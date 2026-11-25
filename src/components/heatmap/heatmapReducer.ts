import type { DayKey } from '../../types/contributions';
import { addDays, maxDay, minDay, type RangeOption } from './calendar';

export type Filter = 'all' | 'work' | 'personal';

export interface HeatmapState {
  range: RangeOption;
  filter: Filter;
  /** The one cell in the tab order (roving tabindex); null = the last day shown. */
  focusDate: DayKey | null;
  /** The cell whose tooltip is showing (hovered or focused). */
  activeDate: DayKey | null;
}

export type HeatmapAction =
  | { type: 'setRange'; range: RangeOption }
  | { type: 'setFilter'; filter: Filter }
  | { type: 'activate'; date: DayKey; focus?: boolean }
  | { type: 'deactivate' }
  | { type: 'move'; days: number; start: DayKey; end: DayKey }
  | { type: 'jump'; to: DayKey };

export const initialHeatmapState: HeatmapState = {
  range: 'last12',
  filter: 'all',
  focusDate: null,
  activeDate: null,
};

/** Phones start on the last 6 months, which fits the screen without scrolling sideways. */
export function initialStateForScreen(): HeatmapState {
  const narrow = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 40rem)').matches;
  return narrow ? { ...initialHeatmapState, range: 'last6' } : initialHeatmapState;
}

export function heatmapReducer(state: HeatmapState, action: HeatmapAction): HeatmapState {
  switch (action.type) {
    case 'setRange':
      return { ...state, range: action.range, focusDate: null, activeDate: null };
    case 'setFilter':
      return { ...state, filter: action.filter };
    case 'activate':
      return { ...state, activeDate: action.date, focusDate: action.focus ? action.date : state.focusDate };
    case 'deactivate':
      return { ...state, activeDate: null };
    case 'move': {
      const from = state.focusDate ?? action.end;
      const target = minDay(maxDay(addDays(from, action.days), action.start), action.end);
      return { ...state, focusDate: target, activeDate: target };
    }
    case 'jump':
      return { ...state, focusDate: action.to, activeDate: action.to };
  }
}
