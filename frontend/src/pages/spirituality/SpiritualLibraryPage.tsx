import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { BookSummary } from '@shared/types/catalog';
import { booksApi, coursesApi } from '@/api/catalog';
import { PageError } from '@/components/common/PageState';
import { CtaBand, EmptyState, FeatureCard, FitImage, PageHero, Section, Spinner, StatRow, type Tone } from '@/components/ui';
import { rupees } from '@/utils/format';

const DIGITAL: { icon: string; title: string; text: string; cta: string; to: string; tone: Tone }[] = [
  { icon: 'fas fa-book-reader', title: 'Read Online', text: 'Browse books available for reading on the site.', cta: 'Browse books', to: '/books', tone: 'indigo' },
  { icon: 'fas fa-headphones', title: 'Audio Scriptures', text: 'Explore courses and lessons available in the catalogue.', cta: 'Browse courses', to: '/courses', tone: 'saffron' },
  { icon: 'fas fa-download', title: 'Download Texts', text: 'Find books available as digital editions.', cta: 'Browse books', to: '/books', tone: 'sage' },
];

type SearchParams = { q?: string; category?: string; language?: string; featured?: boolean };

function BookTiles({ books }: { books: BookSummary[] }) {
  return (
    <div className="row g-4">
      {books.map((book) => (
        <div className="col-sm-6 col-lg-4" key={book.id}>
          <Link to={`/books/${book.slug}`} className="card-soft hover reveal d-flex gap-3 text-decoration-none h-100">
            <div className="cover-frame flex-shrink-0" style={{ width: 96 }}>
              <FitImage src={book.cover} alt={book.title} loading="lazy" />
            </div>
            <div className="min-w-0">
              <h3 className="h5 mb-1 deva">{book.title}</h3>
              {book.author && <div className="small text-muted">{book.author}</div>}
              {(book.category || book.language) && (
                <div className="small text-muted mt-2">{[book.category, book.language].filter(Boolean).join(' · ')}</div>
              )}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

/** Spiritual Library: catalogue and filter options come from the database-backed books API. */
export default function SpiritualLibraryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('');
  const [applied, setApplied] = useState<SearchParams | null>(null);
  const [searchError, setSearchError] = useState('');
  const { data: filters, isLoading: filtersLoading } = useQuery({ queryKey: ['books', 'filters'], queryFn: booksApi.filters });
  const { data: books, isLoading: booksLoading, error: booksError } = useQuery({ queryKey: ['books'], queryFn: () => booksApi.list() });
  const search = useQuery({
    queryKey: ['library', 'search', applied],
    queryFn: () => booksApi.list(applied ?? {}),
    enabled: applied !== null,
  });
  const featuredBooks = books?.filter((book) => book.isFeatured) ?? [];
  const courseQuery = useQuery({ queryKey: ['courses'], queryFn: coursesApi.list });

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    setSearchError('');
    setApplied({ q: query.trim() || undefined, category: category || undefined, language: language || undefined });
  }

  function showFeatured() {
    setSearchError('');
    setApplied({ featured: true });
    document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openRandomBook() {
    if (!books?.length) {
      setSearchError('There are no books in the catalogue yet.');
      return;
    }
    const index = Math.floor(Math.random() * books.length);
    const book = books[index];
    if (book) navigate(`/books/${book.slug}`);
  }

  return (
    <>
      <PageHero
        center
        crumbs={[{ label: 'Spirituality' }, { label: 'Spiritual Library' }]}
        deva="विद्याधनं सर्वधनप्रधानम्"
        title="Spiritual Library"
        lead="Explore spiritual books and learning resources from the SANYOD catalogue. Search by title, subject, or language."
        actions={
          <>
            <a href="#explore" className="btn btn-primary btn-lg"><i className="fas fa-book-open"></i> Explore library</a>
            <a href="#search" className="btn btn-light btn-lg"><i className="fas fa-search text-saffron"></i> Search books</a>
          </>
        }
      >
        {books && filters && (
          <div className="mx-auto mt-4" style={{ maxWidth: 560 }}>
            <StatRow items={[{ value: String(books.length), label: 'Books' }, { value: String(filters.categories.length), label: 'Categories' }, { value: String(filters.languages.length), label: 'Languages' }]} />
          </div>
        )}
      </PageHero>

      <Section id="explore" deva="ज्ञानविभागाः" title="Browse by category" lead="Choose a category assigned to books in the catalogue.">
        {filtersLoading && <Spinner />}
        {booksError && <PageError error={booksError} />}
        {!filtersLoading && filters?.categories.length === 0 && <EmptyState icon="fas fa-book" title="No categories yet" text="Categories will appear when books are added to the catalogue." />}
        <div className="row g-3 g-md-4 grid-compact">
          {filters?.categories.map((item) => (
            <div className="col-6 col-lg-3" key={item}>
              <FeatureCard icon="fas fa-book" title={item} text={`${books?.filter((book) => book.category === item).length ?? 0} books in this category`} tone="indigo">
                <button type="button" className="btn btn-light btn-sm mt-2" onClick={() => { setCategory(item); setApplied({ category: item }); }}>
                  Explore <i className="fas fa-arrow-right ms-1"></i>
                </button>
              </FeatureCard>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="alt" deva="प्रमुखग्रन्थाः" title="Featured books" lead="Books selected as featured in the admin catalogue.">
        {booksLoading && <Spinner />}
        {books && featuredBooks.length === 0 && <EmptyState icon="fas fa-star" title="No featured books yet" text="A site administrator can feature books from the book catalogue." />}
        {featuredBooks.length > 0 && <BookTiles books={featuredBooks} />}
      </Section>

      <Section deva="पुस्तकसंग्रहः" title="Books in the collection" lead="Browse the current catalogue of books and their categories and languages.">
        {booksLoading && <Spinner />}
        {booksError && <PageError error={booksError} />}
        {books && books.length === 0 && <EmptyState icon="fas fa-book" title="No books yet" text="Books will appear here when they are added to the catalogue." />}
        {books && books.length > 0 && <BookTiles books={books} />}
      </Section>

      <Section tone="alt" deva="आभासीपुस्तकालयः" title="Digital access" lead="Access books and courses available in the catalogue.">
        <div className="row g-3 g-md-4 list-compact">
          {DIGITAL.map((item) => (
            <div className="col-md-4" key={item.title}>
              <FeatureCard icon={item.icon} title={item.title} text={item.text} tone={item.tone}>
                <Link to={item.to} className="btn btn-light btn-sm mt-3">{item.cta}</Link>
              </FeatureCard>
            </div>
          ))}
        </div>
      </Section>

      <Section id="search" deva="अन्वेषण" title="Search our library" lead="Search the live book catalogue by title, author, description, category, or language.">
        <form className="card-flat container-narrow reveal" onSubmit={submitSearch} role="search">
          {searchError && <div className="alert alert-warning" role="status">{searchError}</div>}
          <div className="input-group mb-3">
            <span className="input-group-text"><i className="fas fa-search"></i></span>
            <input className="form-control" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search books" aria-label="Search the library" />
            <button className="btn btn-primary" type="submit">Search</button>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="library-category">Category</label>
              <select id="library-category" className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {filters?.categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="library-language">Language</label>
              <select id="library-language" className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="">All languages</option>
                {filters?.languages.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-center flex-wrap mt-4">
            <button type="button" className="btn btn-light" onClick={openRandomBook}><i className="fas fa-random text-saffron"></i> Random book</button>
            <button type="button" className="btn btn-primary" onClick={showFeatured}><i className="fas fa-star"></i> Featured books</button>
          </div>
        </form>
        <div id="search-results" className="container mt-4">
          {search.isFetching && <Spinner />}
          {search.error && <PageError error={search.error} />}
          {search.data && search.data.length === 0 && <EmptyState icon="fas fa-search" title="No matching books" text="Try another title or choose a different category or language." />}
          {search.data && search.data.length > 0 && <BookTiles books={search.data} />}
        </div>
      </Section>

      <Section deva="अध्ययनसाधनानि" title="Study courses" lead="Courses are loaded from the catalogue and managed in the admin panel.">
        {courseQuery.isLoading && <Spinner />}
        {courseQuery.error && <PageError error={courseQuery.error} />}
        {courseQuery.data && courseQuery.data.length === 0 && <EmptyState icon="fas fa-graduation-cap" title="No courses yet" text="Courses will appear here when they are added to the catalogue." />}
        <div className="row g-4">
          {courseQuery.data?.map((course) => (
            <div className="col-sm-6 col-lg-4" key={course.id}>
              <article className="card-soft card-media hover reveal d-flex flex-column">
                <div className="media"><FitImage src={course.image} alt={course.title} loading="lazy" /></div>
                <div className="body">
                  <h3 className="h4">{course.title}</h3>
                  <p className="text-muted small">{course.description}</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="fw-600">{rupees(course.price, false)}</span>
                    <Link to={`/courses/${course.slug}`} className="btn btn-light btn-sm">View course</Link>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </Section>

      <section className="section">
        <div className="container">
          <CtaBand
            deva="पुस्तकस्था तु या विद्या परहस्तगतं धनम्"
            title="Start your spiritual reading journey"
            lead="Browse the current collection of books and courses."
            actions={
              <>
                <Link to="/register" className="btn btn-primary btn-lg"><i className="fas fa-user-plus"></i> Create free account</Link>
                <Link to="/books" className="btn btn-outline-light btn-lg"><i className="fas fa-bookmark"></i> Browse books</Link>
              </>
            }
          />
        </div>
      </section>
    </>
  );
}
