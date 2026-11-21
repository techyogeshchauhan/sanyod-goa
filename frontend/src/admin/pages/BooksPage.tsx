import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { AdminBook } from '@shared/types/admin';
import { rupees } from '@/utils/format';
import { adminApi, toFormData } from '../api';
import {
  AdminModal,
  confirmAction,
  EmptyRow,
  errorMessage,
  fieldErrors,
  FilterSelect,
  ImageInput,
  Loading,
  PageTitle,
  Pagination,
  rupeesInput,
  SearchBox,
  StatusBadge,
  toast,
  useAdminList,
} from '../ui';

export default function BooksPage() {
  const list = useAdminList<AdminBook>('books', '/books');
  const [editing, setEditing] = useState<AdminBook | 'new' | null>(null);
  const qc = useQueryClient();

  async function remove(b: AdminBook) {
    if (!(await confirmAction('Delete this book?', `"${b.title}" will be removed permanently.`, 'Delete', true))) return;
    try {
      await adminApi.del(`/books/${b.id}`);
      toast('Book deleted');
      await qc.invalidateQueries({ queryKey: ['admin', 'books'] });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <>
      <PageTitle title="Books" icon="fas fa-book">
        <button className="btn btn-admin" onClick={() => setEditing('new')}>
          <i className="fas fa-plus"></i> Add Book
        </button>
      </PageTitle>
      <div className="admin-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Title or author…" />
          <FilterSelect value={list.status} onChange={list.setStatus} options={['published', 'draft']} all="All" />
        </div>
        {list.isLoading ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>PDF price</th>
                  <th>Hard copy</th>
                  <th>PDF file</th>
                  <th>Sales</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.data.map((b) => (
                  <tr key={b.id}>
                    <td><img src={b.cover} alt="" className="admin-thumb" /></td>
                    <td>
                      <strong>{b.title}</strong>
                      <div className="small text-muted">/books/{b.slug}{b.legacyId ? ` · old id ${b.legacyId}` : ''}</div>
                    </td>
                    <td>{b.pricePdf == null ? <span className="text-danger">not set</span> : rupees(b.pricePdf, false)}</td>
                    <td>{b.hardcopyAvailable ? rupees(b.priceHardcopy, false) : <span className="text-muted">unavailable</span>}</td>
                    <td>{b.hasPdf ? <i className="fas fa-check text-success"></i> : <span className="text-danger">missing</span>}</td>
                    <td>{b.sales}</td>
                    <td><StatusBadge status={b.isPublished ? 'published' : 'draft'} /></td>
                    <td className="text-end text-nowrap">
                      <a href={`/books/${b.slug}`} target="_blank" rel="noopener" className="btn btn-sm btn-outline-secondary me-1" title="View on site">
                        <i className="fas fa-external-link-alt"></i>
                      </a>
                      <button className="btn btn-sm btn-admin me-1" onClick={() => setEditing(b)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(b)} title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {list.data?.data.length === 0 && <EmptyRow cols={8} text="No books yet." />}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
      {editing && <BookForm book={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function BookForm({ book, onClose }: { book: AdminBook | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState({
    title: book?.title ?? '',
    slug: book?.slug ?? '',
    author: book?.author ?? '',
    description: book?.description ?? '',
    category: book?.category ?? '',
    language: book?.language ?? '',
    isFeatured: book?.isFeatured ?? false,
    pricePdf: rupeesInput(book?.pricePdf),
    priceHardcopy: rupeesInput(book?.priceHardcopy),
    hardcopyAvailable: book?.hardcopyAvailable ?? true,
    pages: book?.pages != null ? String(book.pages) : '',
    publishedYear: book?.publishedYear != null ? String(book.publishedYear) : '',
    rating: book?.rating != null ? String(book.rating) : '',
    reviewCount: book?.reviewCount != null ? String(book.reviewCount) : '',
    isPublished: book?.isPublished ?? true,
    sortOrder: String(book?.sortOrder ?? 0),
  });
  const [cover, setCover] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      const data = toFormData(v, { cover, pdf });
      if (book) await adminApi.form('patch', `/books/${book.id}`, data);
      else await adminApi.form('post', '/books', data);
      toast(book ? 'Book saved' : 'Book added');
      await qc.invalidateQueries({ queryKey: ['admin', 'books'] });
      await qc.invalidateQueries({ queryKey: ['books'] });
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(errorMessage(err), 'error');
      setBusy(false);
    }
  }

  const err = (k: string) => errors[k] && <div className="invalid-feedback d-block">{errors[k]}</div>;

  return (
    <AdminModal
      title={book ? `Edit: ${book.title}` : 'Add Book'}
      onClose={onClose}
      size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-admin" disabled={busy} onClick={save}>
            {busy ? <span className="spinner-border spinner-border-sm"></span> : 'Save'}
          </button>
        </>
      }
    >
      <div className="row g-3">
        <div className="col-md-8">
          <label className="form-label fw-semibold">Title *</label>
          <input className="form-control" value={v.title} onChange={set('title')} />
          {err('title')}
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold">Author</label>
          <input className="form-control" value={v.author} onChange={set('author')} />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">URL slug</label>
          <div className="input-group">
            <span className="input-group-text">/books/</span>
            <input className="form-control" value={v.slug} onChange={set('slug')} placeholder="auto from title" />
          </div>
          {err('slug')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">PDF price (₹)</label>
          <input className="form-control" inputMode="decimal" value={v.pricePdf} onChange={set('pricePdf')} placeholder="empty = not for sale" />
          {err('pricePdf')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Hard copy price (₹)</label>
          <input className="form-control" inputMode="decimal" value={v.priceHardcopy} onChange={set('priceHardcopy')} placeholder="empty = not for sale" />
          {err('priceHardcopy')}
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Category</label>
          <input className="form-control" value={v.category} onChange={set('category')} />
          {err('category')}
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Language</label>
          <input className="form-control" value={v.language} onChange={set('language')} />
          {err('language')}
        </div>
        <div className="col-12">
          <label className="form-label fw-semibold">Description</label>
          <textarea className="form-control" rows={7} value={v.description} onChange={set('description')} />
          <div className="form-text">Line breaks are kept on the book page.</div>
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Pages</label>
          <input className="form-control" inputMode="numeric" value={v.pages} onChange={set('pages')} />
          {err('pages')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Published year</label>
          <input className="form-control" inputMode="numeric" value={v.publishedYear} onChange={set('publishedYear')} />
          {err('publishedYear')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Rating (0-5)</label>
          <input className="form-control" inputMode="decimal" value={v.rating} onChange={set('rating')} placeholder="hidden if empty" />
          {err('rating')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Review count</label>
          <input className="form-control" inputMode="numeric" value={v.reviewCount} onChange={set('reviewCount')} />
        </div>
        <div className="col-md-6">
          <ImageInput label="Cover image" required={!book} current={book?.cover} file={cover} onFile={setCover} />
          {err('cover')}
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Book PDF {book?.hasPdf && <span className="text-success small">(uploaded — choose a file to replace)</span>}</label>
          <input type="file" className="form-control" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
          <div className="form-text">Private: only buyers can open it.</div>
          {err('pdf')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Sort order</label>
          <input className="form-control" inputMode="numeric" value={v.sortOrder} onChange={set('sortOrder')} />
        </div>
        <div className="col-md-9 d-flex align-items-end gap-4 flex-wrap">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="pub" checked={v.isPublished} onChange={set('isPublished')} />
            <label className="form-check-label" htmlFor="pub">Published (shown on the Books page)</label>
          </div>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="hc" checked={v.hardcopyAvailable} onChange={set('hardcopyAvailable')} />
            <label className="form-check-label" htmlFor="hc">Hard copy available</label>
          </div>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="featured" checked={v.isFeatured} onChange={set('isFeatured')} />
            <label className="form-check-label" htmlFor="featured">Featured in Spiritual Library</label>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
