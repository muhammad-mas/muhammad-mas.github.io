import { certifications } from '../../content/certifications';

export function Certifications() {
  return (
    <>
      <h3 className="certs__title">Certifications</h3>
      <ul className="certs">
        {certifications.map(({ title, issuer, date, url }) => (
          <li key={url} className="certs__item">
            <a href={url}>{title}</a>
            <span className="certs__meta">
              {issuer} · {date.slice(-4)}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
