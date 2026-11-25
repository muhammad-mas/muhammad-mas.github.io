import { describe, expect, it } from 'vitest';
import { heatmapReducer, initialHeatmapState, type HeatmapState } from './heatmapReducer';

const bounds = { start: '2026-01-01', end: '2026-11-24' };

describe('heatmapReducer', () => {
  it('moves from the last day when nothing has focus yet', () => {
    const state = heatmapReducer(initialHeatmapState, { type: 'move', days: -7, ...bounds });
    expect(state.focusDate).toBe('2026-11-17');
    expect(state.activeDate).toBe('2026-11-17');
  });

  it('clamps moves to the visible range', () => {
    const atStart: HeatmapState = { ...initialHeatmapState, focusDate: '2026-01-03' };
    expect(heatmapReducer(atStart, { type: 'move', days: -7, ...bounds }).focusDate).toBe('2026-01-01');
    const atEnd: HeatmapState = { ...initialHeatmapState, focusDate: '2026-11-24' };
    expect(heatmapReducer(atEnd, { type: 'move', days: 1, ...bounds }).focusDate).toBe('2026-11-24');
  });

  it('hover shows a tooltip without moving the tab stop; focus moves both', () => {
    const hovered = heatmapReducer(initialHeatmapState, { type: 'activate', date: '2026-05-05' });
    expect(hovered).toMatchObject({ activeDate: '2026-05-05', focusDate: null });
    const focused = heatmapReducer(initialHeatmapState, { type: 'activate', date: '2026-05-05', focus: true });
    expect(focused).toMatchObject({ activeDate: '2026-05-05', focusDate: '2026-05-05' });
  });

  it('changing the period resets focus; changing the filter keeps it', () => {
    const focused: HeatmapState = { ...initialHeatmapState, focusDate: '2026-05-05', activeDate: '2026-05-05' };
    expect(heatmapReducer(focused, { type: 'setRange', range: 2025 })).toMatchObject({ range: 2025, focusDate: null, activeDate: null });
    expect(heatmapReducer(focused, { type: 'setFilter', filter: 'work' })).toMatchObject({ filter: 'work', focusDate: '2026-05-05' });
  });
});
