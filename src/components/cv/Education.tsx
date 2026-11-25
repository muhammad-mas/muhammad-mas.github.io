import type { Education as EducationEntry } from '../../content/profile';

export function Education({ entries }: { entries: EducationEntry[] }) {
  return (
    <ul className="education">
      {entries.map((entry) => (
        <li key={entry.degree} className="education__item card">
          <h3 className="education__degree">
            {entry.degree}, <span className="education__honours">{entry.honours}</span>
          </h3>
          <p className="education__school">{entry.school}</p>
          <p className="education__date">Graduated {entry.graduated}</p>
        </li>
      ))}
    </ul>
  );
}
