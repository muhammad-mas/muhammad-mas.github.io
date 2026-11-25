import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import type { MonthRow } from './counts';
import { formatMonth, formatNumber } from './format';

// TanStack Table v9: register only the features this table uses.
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text },
});

const helper = createColumnHelper<typeof features, MonthRow>();

// Module scope keeps the column definitions stable between renders.
const columns = helper.columns([
  helper.accessor('month', {
    header: 'Month',
    sortFn: 'text', // 'YYYY-MM-01' sorts chronologically as text
    cell: (info) => formatMonth(info.getValue()),
  }),
  helper.accessor('work', {
    header: 'Work',
    sortDescFirst: true,
    cell: (info) => formatNumber(info.getValue()),
  }),
  helper.accessor('personal', {
    // "Pers." on small screens; screen readers always get the full word.
    header: () => (
      <>
        <span className="col-label--full">Personal</span>
        <span className="col-label--short" aria-hidden="true">
          Pers.
        </span>
      </>
    ),
    sortDescFirst: true,
    cell: (info) => formatNumber(info.getValue()),
  }),
  helper.accessor((row) => row.work + row.personal, {
    id: 'total',
    header: 'Total',
    sortDescFirst: true,
    cell: (info) => formatNumber(info.getValue()),
  }),
]);

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;
const ARROW = { asc: '↑', desc: '↓' } as const;

/** The same data as the heatmap as monthly totals, sortable by any column. */
export function HeatmapTable({ rows, caption }: { rows: MonthRow[]; caption: string }) {
  const table = useTable({
    features,
    columns,
    data: rows,
    initialState: { sorting: [{ id: 'month', desc: true }] },
    enableSortingRemoval: false,
  });

  return (
    <details className="heatmap-table">
      <summary>Show as table</summary>
      <div className="heatmap-table__scroller">
        <table>
          <caption className="visually-hidden">{caption}. Select a column heading to sort.</caption>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th key={header.id} scope="col" aria-sort={sorted ? ARIA_SORT[sorted] : 'none'}>
                      <button
                        type="button"
                        className={`heatmap-table__sort${sorted ? ' heatmap-table__sort--active' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        <span className="heatmap-table__arrow" aria-hidden="true">
                          {sorted ? ARROW[sorted] : '↕'}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getAllCells().map((cell, index) =>
                  index === 0 ? (
                    <th key={cell.id} scope="row">
                      <table.FlexRender cell={cell} />
                    </th>
                  ) : (
                    <td key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
