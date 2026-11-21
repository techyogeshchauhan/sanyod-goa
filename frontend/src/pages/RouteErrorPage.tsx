import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

/** A failed lazy page chunk: usually a new deploy (old file names gone) or a dropped connection. */
function isChunkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /dynamically imported module|Importing a module script failed|Failed to fetch|ChunkLoadError|Loading chunk/i.test(msg);
}

/**
 * Shown instead of React Router's default developer screen when a page throws while rendering or
 * its code fails to load. Standalone (no header/footer): the layout itself may be what failed.
 */
export default function RouteErrorPage() {
  const error = useRouteError();
  const chunk = isChunkError(error);
  const detail = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : null;

  return (
    <section className="page-hero center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="container position-relative" style={{ zIndex: 1 }}>
        <div className="eyebrow">{chunk ? 'Update available' : 'Something went wrong'}</div>
        <h1>{chunk ? 'Please reload the page' : 'This page could not be shown'}</h1>
        <p className="lead">
          {chunk
            ? 'A newer version of the site is available, or the connection dropped while loading.'
            : 'An unexpected error occurred. Reloading usually fixes it; if not, please try again later.'}
        </p>
        <div className="hero-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => window.location.reload()}>
            <i className="fas fa-redo"></i> Reload
          </button>
          <Link to="/" className="btn btn-light btn-lg" reloadDocument>
            <i className="fas fa-home"></i> Go to Home
          </Link>
        </div>
        {import.meta.env.DEV && detail && (
          <pre className="text-start small mt-4 p-3 rounded-xl" style={{ background: 'var(--surface-2)', whiteSpace: 'pre-wrap', maxWidth: 820, marginInline: 'auto' }}>
            {detail}
          </pre>
        )}
      </div>
    </section>
  );
}
