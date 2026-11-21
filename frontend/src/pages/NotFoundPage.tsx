import { Link } from 'react-router-dom';

const SUGGESTIONS = [
  { to: '/courses', icon: 'fas fa-play-circle', label: 'Courses' },
  { to: '/books', icon: 'fas fa-book', label: 'Books' },
  { to: '/health', icon: 'fas fa-heartbeat', label: 'Health' },
  { to: '/contact', icon: 'fas fa-envelope', label: 'Contact' },
];

export default function NotFoundPage() {
  return (
    <section className="page-hero center">
      <div className="container position-relative" style={{ zIndex: 1 }}>
        <div className="eyebrow-deva">मार्ग नहीं मिला</div>
        <div className="eyebrow">Error 404</div>
        <h1>Page not found</h1>
        <p className="lead">The page you are looking for does not exist or has been moved.</p>
        <div className="hero-actions">
          <Link to="/" className="btn btn-primary btn-lg">
            <i className="fas fa-home"></i> Go to Home
          </Link>
        </div>
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
          {SUGGESTIONS.map((s) => (
            <Link key={s.to} to={s.to} className="btn btn-light btn-sm">
              <i className={s.icon}></i> {s.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
