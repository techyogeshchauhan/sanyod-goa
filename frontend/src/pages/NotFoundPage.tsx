import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container py-5 my-5 text-center">
      <h1 className="display-1 fw-bold text-primary">404</h1>
      <h2 className="mb-3">Page Not Found</h2>
      <p className="text-muted mb-4">The page you are looking for does not exist or has been moved.</p>
      <Link to="/" className="btn btn-primary rounded-pill py-2 px-4">
        Go to Home
      </Link>
    </div>
  );
}
