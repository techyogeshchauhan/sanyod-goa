import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CourseVideo } from '@shared/types/catalog';
import { formatRupees } from '@shared/utils/text';
import { courseDetailApi } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { confirmPurchase, loginRequired, purchaseRequired } from '@/components/courses/dialogs';
import { PlaylistModal } from '@/components/courses/PlaylistModal';
import { PageError, PageLoading } from '@/components/common/PageState';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import NotFoundPage from '@/pages/NotFoundPage';
import '@/styles/pages/course-details.page.css';
import CourseDetailsContent from './CourseDetailsContent';

/** Course details (course_details.php). */
export default function CourseDetailPage() {
  useBodyClass('page-course-details');
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<{ startWith?: string } | null>(null);
  const { data, isLoading, error } = useQuery({ queryKey: ['course', slug, Boolean(user)], queryFn: () => courseDetailApi.get(slug) });
  const { data: videos } = useQuery({ queryKey: ['course-videos', slug, Boolean(user)], queryFn: () => courseDetailApi.videos(slug) });
  const onClose = useCallback(() => setPlaylist(null), []);
  const modalCourse = useMemo(() => {
    if (!playlist || !data) return null;
    const c = data.course;
    return { slug: c.slug, title: c.title, priceText: formatRupees(c.price), videoCount: c.videoCount, startWith: playlist.startWith };
  }, [playlist, data]);

  if (isLoading) return <PageLoading />;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (error || !data) return <PageError error={error} />;
  const { course, purchase } = data;
  const priceText = formatRupees(course.price);
  const goPay = () => navigate(`/courses/${course.slug}/payment`);

  async function onBuy() {
    if (await confirmPurchase(course.title, priceText, course.videoCount)) goPay();
  }

  async function onVideo(video: CourseVideo) {
    if (!user) {
      if (await loginRequired()) navigate('/login', { state: { from: { pathname: `/courses/${course.slug}` } } });
      return;
    }
    if (!video.canAccess) {
      if (purchase?.status === 'pending') return;
      if (await purchaseRequired(priceText, course.videoCount)) goPay();
      return;
    }
    setPlaylist({ startWith: video.id });
  }

  return (
    <>
      <CourseDetailsContent
        course={course}
        purchase={purchase}
        videos={videos}
        loggedIn={Boolean(user)}
        onBuy={onBuy}
        onPlaylist={(startWith) => setPlaylist({ startWith })}
        onVideo={onVideo}
      />
      <PlaylistModal
        course={modalCourse}
        onClose={onClose}
        onPurchase={() => goPay()}
      />
    </>
  );
}
