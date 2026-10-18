import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CourseSummary } from '@shared/types/course';
import { formatRupees } from '@shared/utils/text';
import { libraryApi, paymentsApi } from '@/api/catalog';
import { coursesApi } from '@/api/courses';
import { loginRequired } from '@/components/courses/dialogs';
import { PlaylistModal } from '@/components/courses/PlaylistModal';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import '@/styles/pages/courses.page.css';
import CoursesContent, { type CourseState } from './CoursesContent';

/** Courses playlist catalogue (courses.php). */
export default function CoursesPage() {
  useBodyClass('page-courses');
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
      <CoursesContent courses={courses} isLoading={isLoading} loggedIn={Boolean(user)} stateOf={stateOf} onPlaylist={onPlaylist} />
      <PlaylistModal
        course={modalCourse}
        onClose={onClose}
        onPurchase={(slug) => navigate(`/courses/${slug}`)}
      />
    </>
  );
}
