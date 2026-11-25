import type { KeyWin } from '../../content/profile';

export function StatTile({ win }: { win: KeyWin }) {
  return (
    <li className="stat card">
      <p className="stat__value">{win.value}</p>
      <p className="stat__label">{win.label}</p>
    </li>
  );
}
