export interface NavLink {
  href: string;
  label: string;
}

interface NavProps {
  id: string;
  links: NavLink[];
  /** Small screens only: whether the dropdown is showing. Wide screens always show the links. */
  open: boolean;
  onNavigate: () => void;
}

export function Nav({ id, links, open, onNavigate }: NavProps) {
  return (
    <nav id={id} aria-label="Sections" className={`nav${open ? ' nav--open' : ''}`}>
      <ul className="nav__list">
        {links.map((link) => (
          <li key={link.href}>
            <a className="nav__link" href={link.href} onClick={onNavigate}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
