import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { booksApi } from '@/api/catalog';
import { EmptyState, FitImage, PageHero, Spinner } from '@/components/ui';

/** Books (books.php). Opening a book needs a login, as on live. */
export default function BooksPage() {
  const { data: books, isLoading } = useQuery({ queryKey: ['books'], queryFn: () => booksApi.list() });

  return (
    <>
      <PageHero
        crumbs={[{ label: 'Books' }]}
        eyebrow="Books"
        title="Books"
        lead="Read as a PDF on any device or order the printed book, delivered free across India."
      />
      <section className="section">
        <div className="container">
          {isLoading && <Spinner />}
          {books && books.length === 0 && <EmptyState icon="fas fa-book" title="No books yet" text="New books will appear here soon." />}
          <div className="row g-4">
            {books?.map((book) => (
              <div className="col-6 col-md-4 col-lg-3" key={book.id}>
                <Link to={`/books/${book.slug}`} className="book-tile reveal" aria-label={book.title}>
                  <div className="cover-frame">
                    <FitImage src={book.cover} loading="lazy" />
                  </div>
                  <h2 className="h5 mt-3 mb-1 deva">{book.title}</h2>
                  <div className="small text-muted">{book.author}</div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
