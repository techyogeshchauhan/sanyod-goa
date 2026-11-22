import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CourseVideo } from '@shared/types/catalog';
import { formatRupees } from '@shared/utils/text';
import { courseDetailApi } from '@/api/catalog';
import { ApiError } from '@/api/client';
import { confirmPurchase, loginRequired, purchaseRequired } from '@/components/courses/dialogs';
import { PlaylistModal } from '@/components/courses/PlaylistModal';
import { PageError } from '@/components/common/PageState';
import { FitImage, Spinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import NotFoundPage from '@/pages/NotFoundPage';
import { duration, nl2lines } from '@/utils/format';

/** Course details (course_details.php). */
export default function CourseDetailPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<{ startWith?: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ['course', slug, Boolean(user)], queryFn: () => courseDetailApi.get(slug) });
  const { data: videos } = useQuery({ queryKey: ['course-videos', slug, Boolean(user)], queryFn: () => courseDetailApi.videos(slug) });
  const onClose = useCallback(() => setPlaylist(null), []);
  const modalCourse = useMemo(() => {
    if (!playlist || !data) return null;
    const c = data.course;
    return { slug: c.slug, title: c.title, priceText: formatRupees(c.price), videoCount: c.videoCount, startWith: playlist.startWith };
  }, [playlist, data]);

  if (isLoading) return <Spinner />;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (error || !data) return <PageError error={error} />;
  const { course, purchase } = data;
  const priceText = formatRupees(course.price);
  const goPay = () => navigate(`/courses/${course.slug}/payment`);
  const shown = showAll ? videos : videos?.slice(0, 12);

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
      <section className="page-hero compact">
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>
              <Link to="/courses">Courses</Link>
            </span>
            <span>{course.title}</span>
          </nav>
          <div className="row g-5 align-items-center">
            <div className="col-md-7">
              <div className="eyebrow">Course</div>
              <h1 className="deva">{course.title}</h1>
              <ul className="meta-list mt-3">
                <li>
                  <i className="fa fa-play-circle"></i>
                  {course.videoCount} videos
                </li>
                <li>
                  <i className="fa fa-infinity"></i>Lifetime access
                </li>
                {course.hasCertificate && (
                  <li>
                    <i className="fa fa-certificate"></i>Certificate
                  </li>
                )}
                <li>
                  <i className="fa fa-signal"></i>
                  {course.level}
                </li>
              </ul>
            </div>
            <div className="col-md-5">
              <div className="split-media" style={{ aspectRatio: '16 / 10' }}>
                <FitImage src={course.image} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-8">
              <div className="card-flat prose deva-text mb-4">
                <h2 className="h4 mb-3">About this course</h2>
                {nl2lines(course.description).map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </div>

              <div className="card-flat">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <h2 className="h4 mb-0">Course content</h2>
                  <span className="text-muted small">{course.videoCount} videos</span>
                </div>
                {videos && videos.length === 0 && <p className="text-muted mb-0">Videos will be added soon.</p>}
                <div className="d-grid gap-1">
                  {shown?.map((v) => (
                    <div
                      key={v.id}
                      className={`video-row video-item ${v.canAccess ? 'open' : 'locked'}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onVideo(v)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onVideo(v)}
                    >
                      <span className="num">{v.order}</span>
                      <span className="title deva">{v.title}</span>
                      <span className="small text-muted d-none d-sm-inline">{duration(v.durationSec)}</span>
                      {v.isFree ? (
                        <span className="chip sage">Free</span>
                      ) : v.canAccess ? (
                        <span className="chip sage">
                          <i className="fa fa-unlock"></i>
                        </span>
                      ) : (
                        <span className="chip rose">
                          <i className="fa fa-lock"></i>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {videos && videos.length > 12 && (
                  <button type="button" className="btn btn-light btn-sm mt-3" onClick={() => setShowAll((s) => !s)}>
                    {showAll ? 'Show fewer' : `Show all ${videos.length} videos`}
                  </button>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card-flat sticky-aside">
                <div className="d-flex align-items-baseline gap-2 flex-wrap mb-1">
                  <span className="price" style={{ fontSize: '2rem' }}>
                    {priceText}
                  </span>
                  {course.discountPercent > 0 && (
                    <>
                      <span className="price-old">{formatRupees(course.originalPrice, false)}</span>
                      <span className="chip sage">{course.discountPercent}% off</span>
                    </>
                  )}
                </div>
                <p className="small text-muted">One-time payment. No recurring charges.</p>

                <div className="d-grid gap-2 mb-3">
                  {!user ? (
                    <>
                      <Link to="/login" state={{ from: { pathname: `/courses/${course.slug}` } }} className="btn btn-primary btn-lg">
                        <i className="fa fa-shopping-cart"></i> Log in to purchase
                      </Link>
                      <Link to="/login" state={{ from: { pathname: `/courses/${course.slug}` } }} className="btn btn-light">
                        <i className="fa fa-play-circle text-saffron"></i> Log in to preview
                      </Link>
                    </>
                  ) : purchase?.canWatch ? (
                    <>
                      <button type="button" className="btn btn-success btn-lg view-playlist" onClick={() => setPlaylist({})}>
                        <i className="fa fa-play-circle"></i> Start Learning
                      </button>
                      <Link to="/my-courses" className="btn btn-light">
                        My courses
                      </Link>
                    </>
                  ) : purchase?.status === 'pending' ? (
                    <>
                      <button type="button" className="btn btn-secondary btn-lg" disabled>
                        <i className="fa fa-clock"></i> Payment pending approval
                      </button>
                      <button type="button" className="btn btn-light view-playlist" onClick={() => setPlaylist({})}>
                        <i className="fa fa-play-circle text-saffron"></i> View playlist
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn-primary btn-lg" id="buyNowBtn" onClick={onBuy}>
                        <i className="fa fa-shopping-cart"></i> Buy Now
                      </button>
                      <button type="button" className="btn btn-light view-playlist" onClick={() => setPlaylist({})}>
                        <i className="fa fa-play-circle text-saffron"></i> View playlist
                      </button>
                    </>
                  )}
                </div>
                {purchase?.status === 'rejected' && !purchase.canWatch && (
                  <div className="alert alert-danger small">Your previous payment could not be verified. You can submit the payment again.</div>
                )}
                <h3 className="h6 mt-4 mb-3">What you'll get</h3>
                <ul className="check-list small">
                  <li>Full lifetime access to all {course.videoCount} videos</li>
                  <li>Downloadable resources and exercises</li>
                  <li>Certificate of completion</li>
                  <li>Q&amp;A support from instructors</li>
                  <li>Mobile and TV access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Phones and tablets: the purchase card sits below the long description, so keep the main action in reach. */}
      <div className="mobile-cta-bar" role="region" aria-label="Purchase">
        {purchase?.canWatch ? (
          <>
            <span className="fw-600 text-ink small">
              <i className="fa fa-check-circle text-sage me-1"></i>You own this course
            </span>
            <button type="button" className="btn btn-success" onClick={() => setPlaylist({})}>
              <i className="fa fa-play-circle"></i> Continue learning
            </button>
          </>
        ) : (
          <>
            <div className="min-w-0">
              <span className="cta-label">{purchase?.status === 'pending' ? 'Payment pending approval' : 'One-time payment'}</span>
              <span className="price">{priceText}</span>
              {course.discountPercent > 0 && <span className="price-old ms-2">{formatRupees(course.originalPrice, false)}</span>}
            </div>
            {!user ? (
              <Link to="/login" state={{ from: { pathname: `/courses/${course.slug}` } }} className="btn btn-primary">
                <i className="fa fa-shopping-cart"></i> Log in to buy
              </Link>
            ) : purchase?.status === 'pending' ? (
              <button type="button" className="btn btn-light" onClick={() => setPlaylist({})}>
                <i className="fa fa-play-circle text-saffron"></i> Playlist
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={onBuy}>
                <i className="fa fa-shopping-cart"></i> Enroll now
              </button>
            )}
          </>
        )}
      </div>
      <PlaylistModal course={modalCourse} onClose={onClose} onPurchase={() => goPay()} />
    </>
  );
}
