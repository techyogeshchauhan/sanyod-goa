import Collapse from 'bootstrap/js/dist/collapse';
import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui';
import { SITE } from '@/config/site';
import { useScrollY } from '@/hooks/useScrollY';
import { useAuth } from '@/providers/AuthProvider';
import { optimizedSrc } from '@/utils/images';

const MENU = [
  { to: '/', label: 'Home', end: true },
  { to: '/courses', label: 'Courses' },
  { to: '/books', label: 'Books' },
  { to: '/programs', label: 'Programmes' },
  { to: '/health', label: 'Health' },
  { to: '/personality-test', label: 'Personality Test' },
] as const;

const SPIRITUALITY = [
  { to: '/spirituality/indian-knowledge', label: 'Indian Knowledge & Wisdom', icon: 'fas fa-om' },
  { to: '/spirituality/library', label: 'Spiritual Library', icon: 'fas fa-book-open' },
  { to: '/spirituality/community', label: 'Community & Satsang', icon: 'fas fa-users' },
  { to: '/spirituality/personal-guidance', label: 'Personal Guidance', icon: 'fas fa-hands-helping' },
] as const;

const ACCOUNT = [
  { to: '/my-books', label: 'My Books', icon: 'fas fa-book' },
  { to: '/my-courses', label: 'My Courses', icon: 'fas fa-play-circle' },
  { to: '/my-orders', label: 'My Orders', icon: 'fas fa-receipt' },
] as const;

const navClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

/** Site header: brand, main menu, Spirituality menu and the account menu. */
export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollY = useScrollY();
  const collapseRef = useRef<HTMLDivElement>(null);
  const spiritualityActive = location.pathname.startsWith('/spirituality');

  // Close the mobile menu after navigating.
  useEffect(() => {
    const el = collapseRef.current;
    if (el?.classList.contains('show')) Collapse.getOrCreateInstance(el, { toggle: false }).hide();
  }, [location.pathname]);

  const displayName = user ? user.name || user.email || 'User' : '';

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className={`site-header${scrollY > 8 ? ' scrolled' : ''}`}>
      <div className="container">
        {/* xl: below 1200px the logo, nine items and the account menu don't fit on one line. */}
        <nav className="navbar navbar-expand-xl p-0" aria-label="Main">
          <Link to="/" className="brand me-3">
            <img src={optimizedSrc(SITE.logo)} alt="" width={92} height={46} />
            <span>
              <span className="brand-name">{SITE.name}</span>
              <span className="brand-tagline">{SITE.tagline}</span>
            </span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarCollapse"
            aria-controls="navbarCollapse"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <i className="fas fa-bars"></i>
          </button>
          <div className="collapse navbar-collapse" id="navbarCollapse" ref={collapseRef}>
            <div className="navbar-nav mx-auto gap-xl-1">
              {MENU.map((item) => (
                <NavLink key={item.to} to={item.to} end={'end' in item && item.end} className={navClass}>
                  {item.label}
                </NavLink>
              ))}
              <div className="nav-item dropdown">
                <a
                  href="#"
                  className={`nav-link dropdown-toggle${spiritualityActive ? ' active' : ''}`}
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={(e) => e.preventDefault()}
                >
                  Spirituality
                </a>
                <div className="dropdown-menu">
                  {SPIRITUALITY.map((item) => (
                    <Link key={item.to} to={item.to} className={`dropdown-item${location.pathname === item.to ? ' active' : ''}`}>
                      <i className={`${item.icon} me-2 text-saffron`} style={{ width: 18 }}></i>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <NavLink to="/about" className={navClass}>
                About
              </NavLink>
              <NavLink to="/contact" className={navClass}>
                Contact
              </NavLink>
            </div>
            <div className="header-actions d-flex align-items-center gap-2">
              {user ? (
                <div className="dropdown">
                  <button
                    className="user-chip dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label={`Account menu: ${displayName}`}
                    title={displayName}
                  >
                    <Avatar name={displayName} />
                    <span className="user-chip-name text-truncate" style={{ maxWidth: 140 }}>
                      {displayName}
                    </span>
                  </button>
                  <div className="dropdown-menu dropdown-menu-end">
                    <div className="user-menu-name text-truncate" style={{ maxWidth: 240 }}>
                      {displayName}
                    </div>
                    {ACCOUNT.map((item) => (
                      <Link key={item.to} to={item.to} className="dropdown-item">
                        <i className={`${item.icon} me-2 text-saffron`} style={{ width: 18 }}></i>
                        {item.label}
                      </Link>
                    ))}
                    <div className="dropdown-divider"></div>
                    <button type="button" className="dropdown-item" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2 text-muted" style={{ width: 18 }}></i>
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn btn-light btn-sm">
                    Log in
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Join free
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
