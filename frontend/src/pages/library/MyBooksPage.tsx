import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { libraryApi } from '@/api/catalog';
import { PageError } from '@/components/common/PageState';
import { EmptyState, PageHero, Spinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { longDate } from '@/utils/format';

const confirmDownload = (e: React.MouseEvent) => {
  if (!window.confirm('Are you sure you want to download this PDF?')) e.preventDefault();
};

/** My Digital Library (my_books.php). */
export default function MyBooksPage() {
  const { user } = useAuth();
  const { data: books, isLoading, error } = useQuery({ queryKey: ['library', 'books'], queryFn: libraryApi.books });

  return (
    <>
      <PageHero
        compact
        crumbs={[{ label: 'My Books' }]}
        eyebrow="My library"
        title={`Welcome back, ${user?.name ?? 'reader'}`}
        lead="All the PDF books you have bought, ready to read online or download."
        actions={
          <>
            <Link to="/books" className="btn btn-primary">
              <i className="fas fa-book-open"></i> Browse books
            </Link>
            <Link to="/my-orders" className="btn btn-light">
              <i className="fas fa-receipt text-saffron"></i> My orders
            </Link>
          </>
        }
      />
      <section className="section">
        <div className="container">
          {isLoading && <Spinner />}
          {error && <PageError error={error} />}
          {books && books.length === 0 && (
            <EmptyState icon="fas fa-book-open" title="No books yet" text="You haven't purchased any PDF books yet. Browse our collection and start building your digital library!">
              <Link to="/books" className="btn btn-primary">
                <i className="fas fa-shopping-cart"></i> Browse books
              </Link>
            </EmptyState>
          )}
          {books && books.length > 0 && (
            <>
              <p className="text-muted mb-4">
                {books.length} {books.length === 1 ? 'book' : 'books'} in your library
              </p>
              <div className="row g-4">
                {books.map((book) => (
                  <div className="col-md-6 col-lg-4" key={book.id}>
                    <article className="card-soft book-card reveal d-flex gap-3">
                      <Link to={`/my-books/${book.slug}`} className="flex-shrink-0" style={{ width: 96 }}>
                        <div className="cover-frame">
                          <img src={book.cover} alt="" />
                        </div>
                      </Link>
                      <div className="d-flex flex-column min-w-0">
                        <h2 className="h5 mb-1 book-title deva">{book.title}</h2>
                        <div className="small text-muted mb-2">by {book.author}</div>
                        <div className="small text-muted mb-3">
                          <i className="fas fa-calendar-check text-sage me-1"></i>
                          Purchased {longDate(book.purchasedAt)}
                        </div>
                        <div className="d-flex gap-2 flex-wrap mt-auto">
                          <Link to={`/my-books/${book.slug}/read`} className="btn btn-primary btn-sm">
                            <i className="fas fa-book-reader"></i> Read Online
                          </Link>
                          <a href={libraryApi.pdfUrl(book.slug, true)} className="btn btn-light btn-sm" onClick={confirmDownload} aria-label={`Download ${book.title}`}>
                            <i className="fas fa-download"></i>
                          </a>
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
