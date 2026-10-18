import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LibraryCourse } from '@shared/types/catalog';
import { formatRupees, previewByBytes } from '@shared/utils/text';
import { libraryApi, paymentsApi } from '@/api/catalog';
import { PlaylistModal } from '@/components/courses/PlaylistModal';
import { PageError } from '@/components/common/PageState';
import { useBodyClass } from '@/hooks/useBodyClass';
import { longDate } from '@/utils/format';
import '@/styles/pages/courses.page.css';

/**
 * My Courses (my_courses.php showed a PHP warning on live, so this page is new). It reuses the
 * courses.php cards and playlist modal.
 */
export default function MyCoursesPage() {
  useBodyClass('page-courses');
  const [open, setOpen] = useState<LibraryCourse | null>(null);
  const { data: courses, isLoading, error } = useQuery({ queryKey: ['library', 'courses'], queryFn: libraryApi.courses });
  const { data: payments } = useQuery({ queryKey: ['payments'], queryFn: paymentsApi.mine });
  const pending = payments?.filter((p) => p.itemType === 'course' && p.status === 'pending') ?? [];
  const onClose = useCallback(() => setOpen(null), []);
  const modalCourse = useMemo(
    () => open && { slug: open.slug, title: open.title, priceText: formatRupees(open.price), videoCount: open.videoCount },
    [open],
  );

  return (
    <section style={{ background: '#f0f0f0', padding: '40px 0', minHeight: '70vh' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h2 className="otto" style={{ fontSize: '30px' }}>
            <i className="fa fa-book"></i> <b>MY COURSES</b>
          </h2>
          <Link to="/courses" className="btn btn-primary">
            <i className="fa fa-tv"></i> Browse Courses
          </Link>
        </div>

        {pending.length > 0 && (
          <div className="alert alert-warning">
            <i className="fa fa-clock"></i> Payment under review for: <strong>{pending.map((p) => p.itemTitle).join(', ')}</strong>. The course
            will appear here once the admin approves it (usually within 24 hours).
          </div>
        )}

        {isLoading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        {error && <PageError error={error} />}

        {courses && courses.length === 0 && (
          <div className="text-center py-5 bg-white rounded-3 shadow-sm">
            <i className="fa fa-book-open fa-4x text-secondary mb-3"></i>
            <h3>No Courses Yet</h3>
            <p className="text-muted">You haven't purchased any course yet. Explore our courses and start learning!</p>
            <Link to="/courses" className="btn btn-primary">
              <i className="fa fa-shopping-cart"></i> Browse Courses
            </Link>
          </div>
        )}

        <div className="row">
          {courses?.map((course) => (
            <div className="col-lg-4 col-md-6 mb-4" key={course.id}>
              <div className="subject-card">
                <div className="subject-image">
                  <img src={course.image} alt={course.title} />
                </div>
                <div className="subject-info">
                  <h3 className="subject-title">{course.title}</h3>
                  <p className="subject-description">{previewByBytes(course.description, 100)}</p>
                  <div className="price-section">
                    <small className="text-muted">
                      <i className="fa fa-calendar-check"></i> Purchased {longDate(course.purchasedAt)}
                    </small>
                    <span className="video-count">{course.videoCount} Videos</span>
                  </div>
                  <div className="action-buttons">
                    <button type="button" className="btn btn-primary view-playlist" onClick={() => setOpen(course)}>
                      <i className="fa fa-play-circle"></i> Watch Now
                    </button>{' '}
                    <Link to={`/courses/${course.slug}`} className="btn btn-outline">
                      <i className="fa fa-info-circle"></i> Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <PlaylistModal course={modalCourse} onClose={onClose} onPurchase={() => undefined} />
    </section>
  );
}
