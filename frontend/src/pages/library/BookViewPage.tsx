import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { libraryApi } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { PageError } from '@/components/common/PageState';
import { FitImage, Spinner } from '@/components/ui';
import { fileSize, longDate, nl2lines } from '@/utils/format';

/** One purchased book (view_book.php design, filled with the real book). */
export default function BookViewPage() {
  const { slug = '' } = useParams();
  const { data: book, isLoading, error } = useQuery({ queryKey: ['library', 'book', slug], queryFn: () => libraryApi.book(slug) });
  const { data: all } = useQuery({ queryKey: ['library', 'books'], queryFn: libraryApi.books });

  if (isLoading) return <Spinner />;
  if (error instanceof ApiError && error.code === 'NOT_PURCHASED') return <NotPurchased slug={slug} />;
  if (error || !book) return <PageError error={error} />;

  const others = (all ?? []).filter((b) => b.slug !== book.slug).slice(0, 4);
  const confirmDownload = (e: React.MouseEvent) => {
    if (!window.confirm('Are you sure you want to download this PDF file?')) e.preventDefault();
  };
  const details: [string, string][] = [
    ['Purchased', longDate(book.purchasedAt)],
    ...(book.orderNumber ? ([['Order', book.orderNumber]] as [string, string][]) : []),
    ['Format', 'PDF'],
    ['File size', fileSize(book.fileSizeBytes)],
    ['Pages', book.pages ? String(book.pages) : '—'],
    ['Language', /[ऀ-ॿ]/.test(book.title) ? 'Hindi' : 'English'],
    ['Published', book.publishedYear ? String(book.publishedYear) : '—'],
    ['Publisher', 'Sanyod.in'],
  ];

  return (
    <section className="section">
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>
            <Link to="/my-books">My Books</Link>
          </span>
          <span>{book.title}</span>
        </nav>
        <div className="row g-5">
          <div className="col-md-4">
            <div className="cover-frame mx-auto" style={{ maxWidth: 320 }}>
              <FitImage src={book.cover} alt={book.title} />
            </div>
          </div>
          <div className="col-md-8">
            <span className="chip sage mb-2">
              <i className="fas fa-check"></i> In your library
            </span>
            <h1 className="deva mb-2">{book.title}</h1>
            <p className="lead">by {book.author}</p>
            <div className="d-flex gap-2 flex-wrap mb-4">
              <Link to={`/my-books/${book.slug}/read`} className="btn btn-primary btn-lg">
                <i className="fas fa-book-open"></i> Read Online
              </Link>
              <a href={libraryApi.pdfUrl(book.slug, true)} className="btn btn-light btn-lg" onClick={confirmDownload}>
                <i className="fas fa-download text-saffron"></i> Download PDF
              </a>
            </div>
            <div className="row g-4">
              <div className="col-lg-7">
                <div className="card-flat prose h-100">
                  <h2 className="h5 mb-3">About this book</h2>
                  {nl2lines(book.description).map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card-flat h-100">
                  <h2 className="h5 mb-3">Details</h2>
                  {details.map(([k, v]) => (
                    <div className="summary-line" key={k}>
                      <span className="text-muted">{k}</span>
                      <span className="text-ink fw-600 text-end">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {others.length > 0 && (
          <div className="mt-5 pt-3">
            <h2 className="h3 mb-4">More from your library</h2>
            <div className="row g-4">
              {others.map((b) => (
                <div className="col-6 col-md-3" key={b.id}>
                  <Link to={`/my-books/${b.slug}`} className="book-tile">
                    <div className="cover-frame">
                      <FitImage src={b.cover} />
                    </div>
                    <h3 className="h6 mt-2 deva">{b.title}</h3>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function NotPurchased({ slug }: { slug: string }) {
  return (
    <section className="section">
      <div className="container container-narrow">
        <div className="empty-state">
          <span className="icon-badge lg">
            <i className="fas fa-lock"></i>
          </span>
          <h1 className="h3">You have not purchased this book yet</h1>
          <p>Buy the PDF or the printed book to read it here.</p>
          <Link to={`/books/${slug}`} className="btn btn-primary">
            View purchase options
          </Link>
        </div>
      </div>
    </section>
  );
}
