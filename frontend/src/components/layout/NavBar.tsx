import { Collapse } from 'bootstrap';
import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SITE } from '@/config/site';
import { useAuth } from '@/providers/AuthProvider';

const MENU = [
  { to: '/', label: 'Home', end: true },
  { to: '/programs', label: 'Programe' },
  { to: '/personality-test', label: 'Personality Test' },
  { to: '/books', label: 'Books' },
  { to: '/courses', label: 'Courses' },
] as const;

const SPIRITUALITY = [
  { to: '/spirituality/indian-knowledge', label: 'Indian Knowledge Wisdom' },
  { to: '/spirituality/library', label: 'Spiritual Library' },
  { to: '/spirituality/community', label: 'Community & Satsanga' },
  { to: '/spirituality/personal-guidance', label: 'Personal Guidance' },
] as const;

const navClass = ({ isActive }: { isActive: boolean }) => `nav-item nav-link${isActive ? ' active' : ''}`;

/** Navbar (header.php "Navbar Start"). Highlights the current page (allowed adjustment A5). */
export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
    <div className="container-fluid nav-bar sticky-top px-3 px-lg-4 py-2 py-lg-0">
      <nav className="navbar navbar-expand-lg navbar-light">
        <Link to="/" className="navbar-brand p-0 d-flex align-items-center">
          <img src={SITE.logo} alt="SANKHYA YOG DARSHAN Logo" />
          <div className="brand-text">
            <span className="brand-name" style={{ fontSize: '34px' }}>
              {SITE.name}
            </span>
            <span className="brand-tagline">{SITE.tagline}</span>
          </div>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarCollapse"
          aria-controls="navbarCollapse"
          aria-label="Toggle navigation"
        >
          <span className="fas fa-bars"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarCollapse" ref={collapseRef}>
          <div className="navbar-nav mx-auto py-0">
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
                role="button"
                aria-expanded="false"
                onClick={(e) => e.preventDefault()}
              >
                Spirituality
              </a>
              <div className="dropdown-menu m-0">
                {SPIRITUALITY.map((item) => (
                  <Link key={item.to} to={item.to} className="dropdown-item">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <NavLink to="/health" className={navClass}>
              Health
            </NavLink>
            <NavLink to="/about" className={navClass}>
              About
            </NavLink>
          </div>

          <div className="d-flex align-items-center">
            {user ? (
              <>
                <span className="me-3 text-dark">
                  <i className="fas fa-user"></i> {displayName}
                </span>
                <Link to="/my-books" className="btn btn-outline-primary btn-sm me-2" aria-label="My Books">
                  <i className="fas fa-book"></i> <span className="d-none d-md-inline">My Books</span>
                </Link>
                <button type="button" className="btn btn-danger rounded-pill py-2 px-3 px-md-4 me-2" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary rounded-pill py-2 px-3 px-md-4 me-2" aria-label="User Login">
                <i className="fas fa-sign-in-alt d-md-none"></i>
                <span className="d-none d-md-inline">User Login</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
