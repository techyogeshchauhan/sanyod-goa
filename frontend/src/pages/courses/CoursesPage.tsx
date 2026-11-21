import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CourseSummary } from '@shared/types/course';
import { formatRupees } from '@shared/utils/text';
import { libraryApi, paymentsApi } from '@/api/catalog';
import { coursesApi } from '@/api/courses';
import { CourseCard } from '@/components/courses/CourseCard';
import { loginRequired } from '@/components/courses/dialogs';
import { PlaylistModal } from '@/components/courses/PlaylistModal';
import { EmptyState, PageHero, Spinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';

type CourseState = 'none' | 'pending' | 'owned';

/** Courses (courses.php): catalogue with playlist preview and purchase status. */
export default function CoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState<CourseSummary | null>(null);
  const { data: courses, isLoading } = useQuery({ queryKey: ['courses'], queryFn: coursesApi.list });
  const { data: owned } = useQuery({ queryKey: ['library', 'courses'], queryFn: libraryApi.courses, enabled: Boolean(user) });
  const { data: payments } = useQuery({ queryKey: ['payments'], queryFn: paymentsApi.mine, enabled: Boolean(user) });

  const ownedIds = useMemo(() => new Set(owned?.map((c) => c.id)), [owned]);
  const pendingSlugs = useMemo(
    () => new Set(payments?.filter((p) => p.itemType === 'course' && p.status === 'pending').map((p) => p.itemSlug)),
    [payments],
  );
  const stateOf = (c: CourseSummary): CourseState => (ownedIds.has(c.id) ? 'owned' : pendingSlugs.has(c.slug) ? 'pending' : 'none');

  async function onPlaylist(course: CourseSummary) {
    if (!user) {
      if (await loginRequired()) navigate('/login', { state: { from: { pathname: '/courses' } } });
      return;
    }
    setOpen(course);
  }
  const onClose = useCallback(() => setOpen(null), []);
  const modalCourse = useMemo(
    () => open && { slug: open.slug, title: open.title, priceText: formatRupees(open.price), videoCount: open.videoCount },
    [open],
  );

  return (
    <>
      <PageHero
        crumbs={[{ label: 'Courses' }]}
        eyebrow="Courses"
        title="Learn at your own pace"
        lead="Video courses on Sankhya, Yoga, health and emotional balance, taught in Hindi with lifetime access."
        actions={
          user ? (
            <Link to="/my-courses" className="btn btn-light">
              <i className="fas fa-play-circle text-saffron"></i> My courses
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary">
              <i className="fas fa-sign-in-alt"></i> Log in to access courses
            </Link>
          )
        }
      />
      <section className="section">
        <div className="container">
          {isLoading && <Spinner />}
          {courses && courses.length === 0 && <EmptyState icon="fas fa-graduation-cap" title="No courses yet" text="New courses are coming soon." />}
          <div className="row g-4">
            {courses?.map((course) => {
              const state = stateOf(course);
              return (
                <div className="col-md-6 col-lg-4" key={course.id}>
                  <CourseCard
                    course={course}
                    tag={state === 'owned' ? <span className="chip sage">Purchased</span> : state === 'pending' ? <span className="chip gold">Pending approval</span> : undefined}
                  >
                    <button className="btn btn-light btn-sm view-playlist" type="button" onClick={() => onPlaylist(course)}>
                      <i className="fa fa-play-circle text-saffron"></i> {state === 'owned' ? 'Watch' : 'View playlist'}
                    </button>
                    {!user ? (
                      <Link to="/login" className="btn btn-primary btn-sm">
                        Log in to buy
                      </Link>
                    ) : state === 'none' ? (
                      <Link to={`/courses/${course.slug}`} className="btn btn-primary btn-sm">
                        Buy now
                      </Link>
                    ) : (
                      <Link to={`/courses/${course.slug}`} className="btn btn-outline-primary btn-sm">
                        Details
                      </Link>
                    )}
                  </CourseCard>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <PlaylistModal course={modalCourse} onClose={onClose} onPurchase={(slug) => navigate(`/courses/${slug}`)} />
    </>
  );
}
