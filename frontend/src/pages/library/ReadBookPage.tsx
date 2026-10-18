import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { libraryApi } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { PageError, PageLoading } from '@/components/common/PageState';
import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/read-book.page.css';

/** Online PDF reader (read_pdf.php). The PDF is streamed only to its owner. */
export default function ReadBookPage() {
  useBodyClass('page-read-book');
  const { slug = '' } = useParams();
  const { data: book, isLoading, error } = useQuery({ queryKey: ['library', 'book', slug], queryFn: () => libraryApi.book(slug) });

  if (isLoading) return <PageLoading />;
  if (error instanceof ApiError && error.code === 'NOT_PURCHASED') {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning d-inline-block">
          You have not purchased this book yet. <Link to={`/books/${slug}`}>View purchase options</Link>
        </div>
      </div>
    );
  }
  if (error || !book) return <PageError error={error} />;

  const pdf = libraryApi.pdfUrl(book.slug);

  return (
    <div className="pdf-viewer-container">
      <div className="container">
        <div className="pdf-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="mb-1">{book.title}</h4>
              <p className="text-muted mb-0">By {book.author}</p>
            </div>
            <div className="pdf-controls">
              <Link to="/my-books" className="btn btn-outline-primary">
                <i className="fas fa-arrow-left"></i> Back to Books
              </Link>
              <a href={libraryApi.pdfUrl(book.slug, true)} className="btn btn-success">
                <i className="fas fa-download"></i> Download PDF
              </a>
            </div>
          </div>
        </div>

        <div className="pdf-viewer-wrapper">
          {book.fileSizeBytes ? (
            <iframe src={`${pdf}#toolbar=0&navpanes=0&scrollbar=1`} className="pdf-embed" title={`${book.title} PDF`}>
              Your browser does not support PDF embedding. Please{' '}
              <a href={libraryApi.pdfUrl(book.slug, true)}>download the PDF</a> instead.
            </iframe>
          ) : (
            <div className="alert alert-danger m-4">
              <h5>
                <i className="fas fa-exclamation-triangle"></i> PDF Not Found
              </h5>
              <p className="mb-0">The PDF for this book is not available yet. Please contact us at sanyod@sanyod.in.</p>
            </div>
          )}
        </div>

        <div className="alert alert-info mt-3">
          <h6>
            <i className="fas fa-info-circle"></i> PDF Reading Tips:
          </h6>
          <ul className="mb-0">
            <li>
              Use <strong>Ctrl + F</strong> to search within the PDF
            </li>
            <li>Use mouse wheel or arrow keys to navigate</li>
            <li>Download the PDF for offline reading</li>
            <li>Bookmark important pages for quick access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
