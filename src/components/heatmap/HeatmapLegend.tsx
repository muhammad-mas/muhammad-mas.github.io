import type { Level } from './levels';

const LEVELS: Level[] = [0, 1, 2, 3, 4];

/** "Less ■■■■■ More"; each swatch names its range of commits per day. */
export function HeatmapLegend({ ranges }: { ranges: string[] }) {
  return (
    <div className="heatmap-legend">
      <span aria-hidden="true">Less</span>
      <ul className="heatmap-legend__swatches" aria-label="Colour scale, commits per day">
        {LEVELS.map((level) => (
          <li key={level} title={ranges[level]}>
            <svg width="12" height="12" aria-hidden="true">
              <rect className={`heat-cell heat-${level}`} width="12" height="12" rx="2" />
            </svg>
            <span className="visually-hidden">{ranges[level]}</span>
          </li>
        ))}
      </ul>
      <span aria-hidden="true">More</span>
    </div>
  );
}
