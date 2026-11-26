import type { Contact } from '../../content/profile';

export function Footer({ name, contact }: { name: string; contact: Contact }) {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>
          © {new Date().getFullYear()} {name}
        </p>
        <p>
          <a href={`mailto:${contact.email}`}>Email</a> · <a href={contact.linkedIn}>LinkedIn</a> ·{' '}
          <a href={contact.gitHub}>GitHub</a>
        </p>
        <p className="site-footer__note">
          Built with React and TypeScript. Anonymous visit counts, no cookies.
        </p>
      </div>
    </footer>
  );
}
