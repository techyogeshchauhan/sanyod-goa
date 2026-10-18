import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { libraryApi } from '@/api/catalog';
import { PageError } from '@/components/common/PageState';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import { longDate } from '@/utils/format';
import '@/styles/pages/my-books.page.css';

const confirmDownload = (e: React.MouseEvent) => {
  if (!window.confirm('Are you sure you want to download this PDF?')) e.preventDefault();
};

/** My Digital Library (my_books.php). */
export default function MyBooksPage() {
  useBodyClass('page-my-books');
  const { user } = useAuth();
  const { data: books, isLoading, error } = useQuery({ queryKey: ['library', 'books'], queryFn: libraryApi.books });

  // Live script: staggered fade-in of the book cards.
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('.book-card').forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      card.classList.add('animate__animated', 'animate__fadeInUp');
    });
  }, [books]);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <>
      <br />
      <br />
      <div className="container">
        {/* Welcome Message */}
        <div className="alert alert-primary d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <i className="fas fa-user-circle fa-lg me-2"></i>
            Welcome back, <strong>{user?.name ?? 'User'}</strong>
            <span className="text-muted ms-2">({user?.email})</span>
          </div>
          <div>
            <Link to="/my-orders" className="btn btn-outline-primary btn-sm me-2">
              <i className="fas fa-shopping-cart"></i> My Orders
            </Link>
            <Link to="/books" className="btn btn-outline-success btn-sm">
              <i className="fas fa-book-open"></i> Browse Books
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="books-stats">
          <div className="stat-card">
            <i className="fas fa-book"></i>
            <h3>{books?.length ?? 0}</h3>
            <p>Total Books Purchased</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-file-pdf"></i>
            <h3>{books?.length ?? 0}</h3>
            <p>PDF Books</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-clock"></i>
            <h3>{currentMonth}</h3>
            <p>Current Month</p>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        {error && <PageError error={error} />}

        {books && books.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-book-open"></i>
            <h3>No Books Purchased Yet</h3>
            <p>You haven't purchased any PDF books yet. Browse our collection and start building your digital library!</p>
            <Link to="/books" className="btn btn-primary btn-lg">
              <i className="fas fa-shopping-cart"></i> Browse Books
            </Link>
          </div>
        )}

        {books && books.length > 0 && (
          <div className="books-grid mb-5">
            {books.map((book) => (
              <div className="book-card" key={book.id}>
                <div className="book-image">
                  <img src={book.cover} alt={book.title} />
                </div>
                <div className="book-content">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">By {book.author}</p>
                  <div className="book-meta">
                    <span>
                      <i className="fas fa-file-pdf"></i> PDF
                    </span>
                    {book.pages && (
                      <span>
                        <i className="fas fa-book-open"></i> {book.pages} Pages
                      </span>
                    )}
                  </div>
                  <div className="purchase-date">
                    <i className="fas fa-calendar-check"></i>
                    Purchased on {longDate(book.purchasedAt)}
                  </div>
                  <div className="action-buttons">
                    <Link to={`/my-books/${book.slug}/read`} className="btn-view">
                      <i className="fas fa-book-reader"></i> Read Online
                    </Link>
                    <a href={libraryApi.pdfUrl(book.slug, true)} className="btn-download" onClick={confirmDownload}>
                      <i className="fas fa-download"></i> Download
                    </a>
                  </div>
                  <div className="text-center mt-2">
                    <Link to={`/my-books/${book.slug}`} className="small">
                      View details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
