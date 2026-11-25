import type { KeyWin } from '../../content/profile';
import { StatTile } from './StatTile';

export function KeyWins({ wins }: { wins: KeyWin[] }) {
  return (
    <div className="container">
      <h2 className="visually-hidden">Key results</h2>
      <ul className="stats">
        {wins.map((win) => (
          <StatTile key={win.value} win={win} />
        ))}
      </ul>
    </div>
  );
}
