import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LibraryCourse } from '@shared/types/catalog';
import { formatRupees } from '@shared/utils/text';
import { libraryApi, paymentsApi } from '@/api/catalog';
import { CourseCard } from '@/components/courses/CourseCard';
import { PlaylistModal } from '@/components/courses/PlaylistModal';
import { PageError } from '@/components/common/PageState';
import { EmptyState, PageHero, Spinner } from '@/components/ui';
import { longDate } from '@/utils/format';

/** My Courses (my_courses.php showed a PHP warning on live, so this page is new). */
export default function MyCoursesPage() {
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
    <>
      <PageHero
        compact
        crumbs={[{ label: 'My Courses' }]}
        eyebrow="My courses"
        title="Continue learning"
        lead="Courses you have unlocked. Pick up where you left off."
        actions={
          <Link to="/courses" className="btn btn-primary">
            <i className="fa fa-graduation-cap"></i> Browse courses
          </Link>
        }
      />
      <section className="section">
        <div className="container">
          {pending.length > 0 && (
            <div className="alert alert-warning">
              <i className="fa fa-clock me-1"></i> Payment under review for: <strong>{pending.map((p) => p.itemTitle).join(', ')}</strong>. The course will appear here once it is
              approved (usually within 24 hours).
            </div>
          )}
          {isLoading && <Spinner />}
          {error && <PageError error={error} />}
          {courses && courses.length === 0 && (
            <EmptyState icon="fas fa-graduation-cap" title="No courses yet" text="You haven't purchased any course yet. Explore our courses and start learning!">
              <Link to="/courses" className="btn btn-primary">
                Browse courses
              </Link>
            </EmptyState>
          )}
          <div className="row g-4">
            {courses?.map((course) => (
              <div className="col-md-6 col-lg-4" key={course.id}>
                <CourseCard
                  course={course}
                  tag={<span className="chip sage">Purchased</span>}
                  meta={
                    <p className="small text-muted mb-3">
                      <i className="fa fa-calendar-check text-sage me-1"></i> Purchased {longDate(course.purchasedAt)}
                    </p>
                  }
                >
                  <button type="button" className="btn btn-primary btn-sm view-playlist" onClick={() => setOpen(course)}>
                    <i className="fa fa-play-circle"></i> Watch now
                  </button>
                  <Link to={`/courses/${course.slug}`} className="btn btn-light btn-sm">
                    Details
                  </Link>
                </CourseCard>
              </div>
            ))}
          </div>
        </div>
      </section>
      <PlaylistModal course={modalCourse} onClose={onClose} onPurchase={() => undefined} />
    </>
  );
}
