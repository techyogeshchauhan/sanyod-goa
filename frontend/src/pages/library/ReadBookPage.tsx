import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { libraryApi } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { PageError } from '@/components/common/PageState';
import { Spinner } from '@/components/ui';
import { NotPurchased } from './BookViewPage';

/** Online PDF reader (read_pdf.php). The PDF is streamed only to its owner. */
export default function ReadBookPage() {
  const { slug = '' } = useParams();
  const { data: book, isLoading, error } = useQuery({ queryKey: ['library', 'book', slug], queryFn: () => libraryApi.book(slug) });

  if (isLoading) return <Spinner />;
  if (error instanceof ApiError && error.code === 'NOT_PURCHASED') return <NotPurchased slug={slug} />;
  if (error || !book) return <PageError error={error} />;

  const pdf = libraryApi.pdfUrl(book.slug);

  return (
    <section className="section-sm">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
          <div>
            <nav className="crumbs mb-1" aria-label="Breadcrumb">
              <Link to="/my-books">My Books</Link>
              <span>Reading</span>
            </nav>
            <h1 className="h3 mb-0 deva">{book.title}</h1>
            <div className="small text-muted">by {book.author}</div>
          </div>
          <div className="d-flex gap-2">
            <Link to="/my-books" className="btn btn-light">
              <i className="fas fa-arrow-left"></i> Back
            </Link>
            <a href={libraryApi.pdfUrl(book.slug, true)} className="btn btn-primary">
              <i className="fas fa-download"></i> Download PDF
            </a>
          </div>
        </div>

        <div className="reader-frame">
          {book.fileSizeBytes ? (
            <iframe src={`${pdf}#toolbar=0&navpanes=0&scrollbar=1`} className="pdf-embed" title={`${book.title} PDF`}>
              Your browser does not support PDF embedding. Please <a href={libraryApi.pdfUrl(book.slug, true)}>download the PDF</a> instead.
            </iframe>
          ) : (
            <div className="alert alert-danger m-4">
              <h2 className="h5">
                <i className="fas fa-exclamation-triangle me-2"></i>PDF not available
              </h2>
              <p className="mb-0">The PDF for this book is not available yet. Please contact us at sanyod@sanyod.in.</p>
            </div>
          )}
        </div>

        <p className="small text-muted mt-3 mb-0">
          <i className="fas fa-lightbulb text-saffron me-1"></i> Tip: use <kbd>Ctrl</kbd> + <kbd>F</kbd> to search inside the PDF, or download it for offline reading.
        </p>
      </div>
    </section>
  );
}
