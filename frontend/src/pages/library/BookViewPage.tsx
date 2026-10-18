import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { libraryApi } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { PageError, PageLoading } from '@/components/common/PageState';
import { useBodyClass } from '@/hooks/useBodyClass';
import { fileSize, longDate, nl2lines } from '@/utils/format';
import '@/styles/pages/view-book.page.css';

/** One purchased book (view_book.php design, filled with the real book). */
export default function BookViewPage() {
  useBodyClass('page-view-book');
  const { slug = '' } = useParams();
  const { data: book, isLoading, error } = useQuery({ queryKey: ['library', 'book', slug], queryFn: () => libraryApi.book(slug) });
  const { data: all } = useQuery({ queryKey: ['library', 'books'], queryFn: libraryApi.books });
  const cardRef = useRef<HTMLDivElement>(null);

  // Live script: fade the card in.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    const id = window.setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100);
    return () => window.clearTimeout(id);
  }, [book]);

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

  const others = (all ?? []).filter((b) => b.slug !== book.slug).slice(0, 3);
  const confirmDownload = (e: React.MouseEvent) => {
    if (!window.confirm('Are you sure you want to download this PDF file?')) e.preventDefault();
  };

  return (
    <div className="book-view-container">
      <div className="container">
        <Link to="/my-books" className="btn btn-back mb-4">
          <i className="fas fa-arrow-left"></i> Back to Books
        </Link>
        <div className="book-detail-card" ref={cardRef}>
          <div className="book-header">
            <div className="book-header-content">
              <div className="book-cover">
                <img src={book.cover} alt={book.title} />
              </div>
              <div className="book-info">
                <h1 className="book-title">{book.title}</h1>
                <p className="book-author">By {book.author}</p>
                <div className="book-meta-grid">
                  <div className="meta-item">
                    <div className="meta-label">Category</div>
                    <div className="meta-value">Spirituality</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Pages</div>
                    <div className="meta-value">{book.pages ?? '—'}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Language</div>
                    <div className="meta-value">{/[ऀ-ॿ]/.test(book.title) ? 'Hindi' : 'English'}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Format</div>
                    <div className="meta-value">PDF</div>
                  </div>
                </div>
                <div className="book-actions">
                  <Link to={`/my-books/${book.slug}/read`} className="btn-action btn-read">
                    <i className="fas fa-book-open"></i> Read Online
                  </Link>
                  <a href={libraryApi.pdfUrl(book.slug, true)} className="btn-action btn-download" onClick={confirmDownload}>
                    <i className="fas fa-download"></i> Download PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="book-body">
            <div className="book-section">
              <h3 className="section-title">Book Description</h3>
              <div className="book-description">
                {nl2lines(book.description).map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </div>
            </div>
            <div className="book-section">
              <h3 className="section-title">Additional Information</h3>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td>Purchase Date</td>
                    <td>{longDate(book.purchasedAt)}</td>
                  </tr>
                  {book.orderNumber && (
                    <tr>
                      <td>Order Number</td>
                      <td>{book.orderNumber}</td>
                    </tr>
                  )}
                  <tr>
                    <td>File Size</td>
                    <td>{fileSize(book.fileSizeBytes)}</td>
                  </tr>
                  <tr>
                    <td>Publisher</td>
                    <td>Sanyod.in</td>
                  </tr>
                  <tr>
                    <td>Publication Year</td>
                    <td>{book.publishedYear ?? '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {others.length > 0 && (
          <div className="similar-books">
            <h3 className="section-title">More Books</h3>
            <div className="similar-grid">
              {others.map((b) => (
                <div className="similar-card" key={b.id}>
                  <div className="similar-cover">
                    <img src={b.cover} alt={b.title} />
                  </div>
                  <div className="similar-content">
                    <h4 className="similar-title">{b.title}</h4>
                    <p className="similar-author">{b.author}</p>
                    <Link to={`/my-books/${b.slug}`} className="btn-view-similar">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
