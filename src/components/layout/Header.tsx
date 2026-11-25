import { useEffect, useState } from 'react';
import { CloseIcon, MenuIcon } from './Icons';
import { Nav, type NavLink } from './Nav';
import { ThemeToggle } from './ThemeToggle';

const NAV_ID = 'site-nav';

export function Header({ name, links }: { name: string; links: NavLink[] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape closes the small-screen menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a className="site-header__brand" href="#top">
          {name}
        </a>
        <Nav id={NAV_ID} links={links} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        <div className="site-header__actions">
          <ThemeToggle />
          <button
            type="button"
            className="icon-button nav-toggle"
            aria-expanded={menuOpen}
            aria-controls={NAV_ID}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
