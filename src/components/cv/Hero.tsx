import type { Profile } from '../../content/profile';
import { DownloadIcon, GitHubIcon, LinkedInIcon, MailIcon, PinIcon } from '../layout/Icons';

// Phone-free copies of the CV, served as static files from public/resume.
const RESUME = `${import.meta.env.BASE_URL}resume/Muhammad_Arslan_Resume`;

export function Hero({ profile }: { profile: Profile }) {
  const { contact } = profile;
  return (
    <section className="hero" aria-labelledby="hero-name">
      <div className="container">
        <p className="hero__eyebrow">{profile.title}</p>
        <h1 id="hero-name" className="hero__name">
          {profile.name}
        </h1>
        <p className="hero__tagline">{profile.tagline}</p>
        <p className="hero__meta">
          <PinIcon className="hero__meta-icon" />
          <span>{profile.location}</span>
          <span aria-hidden="true">·</span>
          <span>{profile.workRights}</span>
        </p>
        <div className="hero__about">
          {profile.about.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        <div className="hero__actions">
          <a className="button button--primary" href={`mailto:${contact.email}`}>
            <MailIcon /> Email me
          </a>
          <a className="button" href={contact.linkedIn} rel="me">
            <LinkedInIcon /> LinkedIn
          </a>
          <a className="button" href={contact.gitHub} rel="me">
            <GitHubIcon /> GitHub
          </a>
          <a className="button" href={`${RESUME}.pdf`} download>
            <DownloadIcon /> CV (PDF)
          </a>
          <a className="button" href={`${RESUME}.docx`} download>
            <DownloadIcon /> CV (Word)
          </a>
        </div>
      </div>
    </section>
  );
}
