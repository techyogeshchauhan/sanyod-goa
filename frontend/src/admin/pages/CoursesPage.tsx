import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AdminCourse, AdminVideo } from '@shared/types/admin';
import { duration, rupees } from '@/utils/format';
import { adminApi, toFormData } from '../api';
import {
  AdminModal,
  confirmAction,
  EmptyRow,
  errorMessage,
  fieldErrors,
  FilterSelect,
  FormErrors,
  ImageInput,
  Loading,
  PageTitle,
  Pagination,
  QueryError,
  rupeesInput,
  SearchBox,
  StatusBadge,
  toast,
  useAdminList,
} from '../ui';

export default function CoursesPage() {
  const list = useAdminList<AdminCourse>('courses', '/courses');
  const [editing, setEditing] = useState<AdminCourse | 'new' | null>(null);
  const qc = useQueryClient();

  async function remove(c: AdminCourse) {
    if (!(await confirmAction('Delete this course?', `"${c.title}" and its videos will be removed permanently.`, 'Delete', true))) return;
    try {
      await adminApi.del(`/courses/${c.id}`);
      toast('Course deleted');
      await qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <>
      <PageTitle title="Courses" icon="fas fa-play-circle">
        <button className="btn btn-admin" onClick={() => setEditing('new')}>
          <i className="fas fa-plus"></i> Add Course
        </button>
      </PageTitle>
      <div className="admin-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <SearchBox value={list.q} onChange={list.setQ} placeholder="Course title…" />
          <FilterSelect value={list.status} onChange={list.setStatus} options={['published', 'draft']} all="All" />
        </div>
        {list.isError && <QueryError error={list.error} onRetry={() => void list.refetch()} />}
        {list.isLoading ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Videos</th>
                  <th>Students</th>
                  <th>Popular #</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.data.map((c) => (
                  <tr key={c.id}>
                    <td><img src={c.image} alt="" className="admin-thumb" /></td>
                    <td>
                      <strong>{c.title}</strong>
                      <div className="small text-muted">/courses/{c.slug}{c.legacyId ? ` · old id ${c.legacyId}` : ''}</div>
                    </td>
                    <td>
                      {rupees(c.price)}
                      <div className="small text-muted">{c.discountPercent}% off shown</div>
                    </td>
                    <td>{c.videoCount}</td>
                    <td>{c.students}</td>
                    <td>{c.popularRank ?? '—'}</td>
                    <td><StatusBadge status={c.isPublished ? 'published' : 'draft'} /></td>
                    <td className="text-end text-nowrap">
                      <Link to={`/admin/courses/${c.id}/videos`} className="btn btn-sm btn-outline-primary me-1">
                        <i className="fas fa-list-ol"></i> Videos
                      </Link>
                      <button className="btn btn-sm btn-admin me-1" onClick={() => setEditing(c)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(c)} title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {list.data?.data.length === 0 && <EmptyRow cols={8} text="No courses yet." />}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={list.page} pageSize={list.pageSize} total={list.data.total} onPage={list.setPage} />}
      </div>
      {editing && <CourseForm course={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function CourseForm({ course, onClose }: { course: AdminCourse | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState({
    title: course?.title ?? '',
    slug: course?.slug ?? '',
    description: course?.description ?? '',
    price: rupeesInput(course?.price),
    discountPercent: String(course?.discountPercent ?? 0),
    level: course?.level ?? '',
    hasCertificate: course?.hasCertificate ?? false,
    popularRank: course?.popularRank != null ? String(course.popularRank) : '',
    isPublished: course?.isPublished ?? true,
    sortOrder: String(course?.sortOrder ?? 0),
  });
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const err = (k: string) => errors[k] && <div className="invalid-feedback d-block">{errors[k]}</div>;

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      const data = toFormData(v, { image });
      if (course) await adminApi.form('patch', `/courses/${course.id}`, data);
      else await adminApi.form('post', '/courses', data);
      toast(course ? 'Course saved' : 'Course added');
      await qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
      await qc.invalidateQueries({ queryKey: ['courses'] });
      onClose();
    } catch (e) {
      setErrors(fieldErrors(e));
      toast(errorMessage(e), 'error');
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={course ? `Edit: ${course.title}` : 'Add Course'}
      onClose={onClose}
      size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-admin" disabled={busy} onClick={save}>{busy ? <span className="spinner-border spinner-border-sm"></span> : 'Save'}</button>
        </>
      }
    >
      <FormErrors errors={errors} shown={['title', 'slug', 'price', 'discountPercent', 'level', 'popularRank', 'image', 'sortOrder']} labels={{ description: 'Description' }} />
      <div className="row g-3">
        <div className="col-md-8">
          <label className="form-label fw-semibold">Title *</label>
          <input className="form-control" value={v.title} onChange={set('title')} />
          {err('title')}
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold">URL slug</label>
          <input className="form-control" value={v.slug} onChange={set('slug')} placeholder="auto from title" />
          {err('slug')}
        </div>
        <div className="col-12">
          <label className="form-label fw-semibold">Description</label>
          <textarea className="form-control" rows={8} value={v.description} onChange={set('description')} />
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Price (₹) *</label>
          <input className="form-control" inputMode="decimal" value={v.price} onChange={set('price')} />
          {err('price')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Discount shown (%)</label>
          <input className="form-control" inputMode="numeric" value={v.discountPercent} onChange={set('discountPercent')} />
          <div className="form-text">The struck-through price is calculated from it.</div>
          {err('discountPercent')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Level</label>
          <input className="form-control" value={v.level} onChange={set('level')} />
          {err('level')}
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Home "Most Popular" position</label>
          <input className="form-control" inputMode="numeric" value={v.popularRank} onChange={set('popularRank')} placeholder="empty = not listed" />
          {err('popularRank')}
        </div>
        <div className="col-md-6">
          <ImageInput label="Course image" required={!course} current={course?.image} file={image} onFile={setImage} />
          {err('image')}
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Sort order</label>
          <input className="form-control" inputMode="numeric" value={v.sortOrder} onChange={set('sortOrder')} />
          {err('sortOrder')}
        </div>
        <div className="col-md-4 d-flex flex-column justify-content-end gap-2">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="cpub" checked={v.isPublished} onChange={set('isPublished')} />
            <label className="form-check-label" htmlFor="cpub">Published</label>
          </div>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="cert" checked={v.hasCertificate} onChange={set('hasCertificate')} />
            <label className="form-check-label" htmlFor="cert">Shows "Certificate"</label>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}

/** Videos of one course: add, edit, reorder, delete. */
export function CourseVideosPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const courseQuery = useQuery({ queryKey: ['admin', 'course', id], queryFn: () => adminApi.get<AdminCourse>(`/courses/${id}`) });
  const course = courseQuery.data;
  const { data: videos, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'videos', id], queryFn: () => adminApi.get<AdminVideo[]>(`/courses/${id}/videos`) });
  const [editing, setEditing] = useState<AdminVideo | 'new' | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] });

  async function move(index: number, delta: number) {
    if (!videos) return;
    const ids = videos.map((v) => v.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved as string);
    try {
      await adminApi.post(`/courses/${id}/videos/reorder`, { ids });
      await refresh();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  async function remove(v: AdminVideo) {
    if (!(await confirmAction('Delete this video?', v.title, 'Delete', true))) return;
    try {
      await adminApi.del(`/videos/${v.id}`);
      toast('Video deleted');
      await refresh();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <>
      <PageTitle title={course ? `Videos: ${course.title}` : 'Videos'} icon="fas fa-list-ol">
        <Link to="/admin/courses" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left"></i> Courses
        </Link>
        <button className="btn btn-admin" disabled={!course} onClick={() => setEditing('new')}>
          <i className="fas fa-plus"></i> Add Video
        </button>
      </PageTitle>
      <div className="admin-panel">
        {courseQuery.isError && <QueryError error={courseQuery.error} onRetry={() => void courseQuery.refetch()} />}
        {error && <QueryError error={error} onRetry={() => void refetch()} />}
        <p className="small text-muted">
          Paid videos are only sent to students who bought the course. Mark a video <strong>Free</strong> to let every logged-in visitor watch it.
        </p>
        {isLoading ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>YouTube</th>
                  <th>Duration</th>
                  <th>Access</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {videos?.map((v, i) => (
                  <tr key={v.id}>
                    <td>{i + 1}</td>
                    <td>{v.title}</td>
                    <td>
                      <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener">{v.youtubeId}</a>
                    </td>
                    <td>{duration(v.durationSec)}</td>
                    <td>{v.isFree ? <span className="badge bg-success">Free</span> : <span className="badge bg-danger">Paid</span>}</td>
                    <td><StatusBadge status={v.isPublished ? 'published' : 'draft'} /></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-secondary me-1" disabled={i === 0} onClick={() => move(i, -1)} title="Move up">
                        <i className="fas fa-arrow-up"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-secondary me-1" disabled={i === videos.length - 1} onClick={() => move(i, 1)} title="Move down">
                        <i className="fas fa-arrow-down"></i>
                      </button>
                      <button className="btn btn-sm btn-admin me-1" onClick={() => setEditing(v)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(v)} title="Delete">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {videos?.length === 0 && <EmptyRow cols={7} text="No videos yet." />}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && <VideoForm courseId={id} video={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function VideoForm({ courseId, video, onClose }: { courseId: string; video: AdminVideo | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(video?.title ?? '');
  const [youtube, setYoutube] = useState(video?.youtubeId ?? '');
  const [minutes, setMinutes] = useState(video?.durationSec != null ? String(Math.round((video.durationSec / 60) * 10) / 10) : '');
  const [isFree, setIsFree] = useState(video?.isFree ?? false);
  const [isPublished, setIsPublished] = useState(video?.isPublished ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setErrors({});
    // An empty duration is sent as null, which clears it.
    const body = { title, youtube, isFree, isPublished, durationMinutes: minutes.trim() ? minutes.trim() : null };
    try {
      if (video) await adminApi.patch(`/videos/${video.id}`, body);
      else await adminApi.post(`/courses/${courseId}/videos`, body);
      toast('Video saved');
      await qc.invalidateQueries({ queryKey: ['admin'] });
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(errorMessage(err), 'error');
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={video ? 'Edit Video' : 'Add Video'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-admin" disabled={busy} onClick={save}>Save</button>
        </>
      }
    >
      <label className="form-label fw-semibold">Title *</label>
      <input className="form-control mb-1" value={title} onChange={(e) => setTitle(e.target.value)} />
      {errors.title && <div className="invalid-feedback d-block">{errors.title}</div>}
      <label className="form-label fw-semibold mt-2">YouTube link or video ID *</label>
      <input className="form-control mb-1" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtu.be/… or the 11-character ID" />
      {errors.youtube && <div className="invalid-feedback d-block">{errors.youtube}</div>}
      <label className="form-label fw-semibold mt-2">Duration (minutes)</label>
      <input className="form-control mb-1" inputMode="decimal" value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ maxWidth: 160 }} />
      {errors.durationMinutes && <div className="invalid-feedback d-block">{errors.durationMinutes}</div>}
      <div className="mb-3"></div>
      <div className="form-check">
        <input className="form-check-input" type="checkbox" id="free" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
        <label className="form-check-label" htmlFor="free">Free preview (any logged-in visitor can watch)</label>
      </div>
      <div className="form-check">
        <input className="form-check-input" type="checkbox" id="vpub" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        <label className="form-check-label" htmlFor="vpub">Published</label>
      </div>
    </AdminModal>
  );
}
