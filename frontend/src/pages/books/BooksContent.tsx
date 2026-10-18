// Generated from reference/live-html/books.html by scripts/html-to-jsx.mjs, then edited by hand:
// the cards now come from GET /api/books. Markup, classes and texts match the live page;
// styles: src/styles/pages/books.page.css
import { Link } from 'react-router-dom';
import type { BookSummary } from '@shared/types/catalog';

export default function BooksContent({ books, isLoading }: { books: BookSummary[] | undefined; isLoading: boolean }) {
  return (
    <section style={{ background: '#f0f0f0' }}>
      <div className="container py-5">
        <div className="d-flex justify-content-between">
          <h2 className="otto">
            <i className="fa fa-tv"></i>{' '}
            <b>Latest Images</b>
          </h2>
        </div>
        <div className="row">
          {isLoading && (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          {books?.map((book) => (
            <div className="col-md-6 col-lg-4" key={book.id}>
              <div className="gallery-card">
                <Link to={`/books/${book.slug}`}>
                  <img className="gallery-image" src={book.cover} alt={book.title} />
                </Link>
                <div className="image-name">{book.title}</div>
              </div>
            </div>
          ))}
          {books && books.length === 0 && <p className="text-muted text-center py-5">No books available yet.</p>}
        </div>
      </div>
    </section>
  );
}
