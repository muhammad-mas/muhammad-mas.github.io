import { useEffect, useRef, type Dispatch, type KeyboardEvent, type ReactNode } from 'react';
import type { DayKey } from '../../types/contributions';
import type { Calendar } from './calendar';
import { HeatmapCell } from './HeatmapCell';
import type { HeatmapAction } from './heatmapReducer';
import type { Level } from './levels';

const SIZES = {
  regular: { cell: 13, gap: 2, left: 30, top: 20 },
  small: { cell: 8, gap: 2, left: 0, top: 0 },
} as const;


/** SVG geometry is in user units (1 unit = 1px at full size); CSS sizes are in rem. */
const toRem = (units: number) => `${(units / 16).toFixed(3)}rem`;

const WEEKDAY_LABELS: [number, string][] = [
  [0, 'Mon'],
  [2, 'Wed'],
  [4, 'Fri'],
];

const KEY_STEPS: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };

export interface GridInteraction {
  dispatch: Dispatch<HeatmapAction>;
  focusDate: DayKey;
  activeDate: DayKey | null;
  start: DayKey;
  end: DayKey;
  renderTooltip: (date: DayKey) => ReactNode;
}

interface HeatmapGridProps {
  calendar: Calendar;
  levelOf: (date: DayKey) => Level;
  labelOf: (date: DayKey) => string;
  /** Names the whole chart for screen readers. */
  ariaLabel: string;
  size?: keyof typeof SIZES;
  interaction?: GridInteraction;
}

export function HeatmapGrid({ calendar, levelOf, labelOf, ariaLabel, size = 'regular', interaction }: HeatmapGridProps) {
  const { cell, gap, left, top } = SIZES[size];
  const step = cell + gap;
  const width = left + calendar.weeks * step - gap;
  const height = top + 7 * step - gap;
  const svgRef = useRef<SVGSVGElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const showAxes = size === 'regular';

  // On narrow screens the grid scrolls sideways: start at the most recent weeks.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, [calendar]);

  // Arrow keys move the roving tab stop; keep real focus on it.
  const focusDate = interaction?.focusDate;
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !focusDate || !svg.contains(document.activeElement)) return;
    svg.querySelector<SVGRectElement>(`[data-date="${focusDate}"]`)?.focus();
  }, [focusDate]);

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (!interaction) return;
    const { dispatch, start, end } = interaction;
    const days = KEY_STEPS[event.key];
    if (days !== undefined) dispatch({ type: 'move', days, start, end });
    else if (event.key === 'Home') dispatch({ type: 'jump', to: start });
    else if (event.key === 'End') dispatch({ type: 'jump', to: end });
    else if (event.key === 'Escape') dispatch({ type: 'deactivate' });
    else return;
    event.preventDefault();
  };

  const active = interaction?.activeDate ? calendar.cells.find((c) => c.date === interaction.activeDate) : undefined;
  // The SVG may be drawn smaller than its viewBox; tooltip positions are in screen pixels.
  const renderedWidth = svgRef.current?.getBoundingClientRect().width || width;
  const scale = renderedWidth / width;
  const scrollLeft = scrollerRef.current?.scrollLeft ?? 0;
  const visibleWidth = scrollerRef.current?.clientWidth || width;
  const tooltipX = active ? (left + active.week * step + cell / 2) * scale - scrollLeft : 0;
  const tooltipY = active ? (top + active.weekday * step) * scale : 0;
  const svgStyle =
    size === 'regular'
      ? { width: '100%', maxWidth: toRem(width), height: 'auto' } // always shrinks to fit: never scrolls sideways
      : undefined;
  const align = tooltipX < 90 ? 'start' : tooltipX > visibleWidth - 90 ? 'end' : 'center';

  return (
    <div className={`heatmap-grid heatmap-grid--${size}`}>
      <div
        className="heatmap-grid__scroller"
        ref={scrollerRef}
        onScroll={interaction ? () => interaction.dispatch({ type: 'deactivate' }) : undefined}
      >
        <svg
          ref={svgRef}
          width={toRem(width)}
          height={toRem(height)}
          viewBox={`0 0 ${width} ${height}`}
          style={svgStyle}
          role={interaction ? 'group' : 'img'}
          aria-label={ariaLabel}
          onKeyDown={interaction ? onKeyDown : undefined}
          onPointerLeave={interaction ? () => interaction.dispatch({ type: 'deactivate' }) : undefined}
          onBlur={
            interaction
              ? (event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    interaction.dispatch({ type: 'deactivate' });
                  }
                }
              : undefined
          }
        >
          {showAxes && (
            <g className="heatmap-grid__axis" aria-hidden="true">
              {calendar.monthLabels.map(({ week, label }) => (
                <text key={`${label}-${week}`} x={left + week * step} y={top - 7}>
                  {label}
                </text>
              ))}
              {WEEKDAY_LABELS.map(([row, label]) => (
                <text key={label} x={0} y={top + row * step + cell - 2}>
                  {label}
                </text>
              ))}
            </g>
          )}
          {calendar.cells.map((c) => (
            <HeatmapCell
              key={c.date}
              date={c.date}
              x={left + c.week * step}
              y={top + c.weekday * step}
              size={cell}
              level={levelOf(c.date)}
              label={interaction ? labelOf(c.date) : ''}
              dispatch={interaction?.dispatch}
              tabbable={interaction?.focusDate === c.date}
              active={interaction?.activeDate === c.date}
            />
          ))}
        </svg>
      </div>
      {interaction && active && (
        <div className={`heatmap-tooltip heatmap-tooltip--${align}`} style={{ left: tooltipX, top: tooltipY }} aria-hidden="true">
          {interaction.renderTooltip(active.date)}
        </div>
      )}
    </div>
  );
}
