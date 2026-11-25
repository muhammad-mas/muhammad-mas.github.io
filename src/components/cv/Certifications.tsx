import { certifications } from '../../content/certifications';

export function Certifications() {
  return (
    <ul className="education">
      {certifications.map(({ title, issuer, date, url }) => (
        <li key={url} className="education__item card">
          <h3 className="education__degree">
            <a href={url}>{title}</a>
          </h3>
          <p className="education__school">{issuer}</p>
          <p className="education__date">{date}</p>
        </li>
      ))}
    </ul>
  );
}
