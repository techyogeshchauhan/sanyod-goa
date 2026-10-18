// Generated from reference/live-html/course_details__subject_id_7.html by scripts/html-to-jsx.mjs, then
// edited by hand: course, videos and buttons come from the API. Markup, classes and texts match the
// live page; styles: src/styles/pages/course-details.page.css
import { Link } from 'react-router-dom';
import type { CourseDetail, CoursePurchaseStatus, CourseVideo } from '@shared/types/catalog';
import { formatRupees } from '@shared/utils/text';
import { duration, nl2lines } from '@/utils/format';

interface Props {
  course: CourseDetail;
  purchase: CoursePurchaseStatus | null;
  videos: CourseVideo[] | undefined;
  loggedIn: boolean;
  onBuy: () => void;
  onPlaylist: (startWith?: string) => void;
  onVideo: (video: CourseVideo) => void;
}

export default function CourseDetailsContent({ course, purchase, videos, loggedIn, onBuy, onPlaylist, onVideo }: Props) {
  return (
    <section style={{ background: '#f0f0f0', padding: '40px 0' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h2 className="otto" style={{ fontSize: '30px' }}>
            <i className="fa fa-book"></i>
            <b>COURSE DETAILS</b>
          </h2>
          <Link to="/courses" className="btn btn-outline-primary">
            <i className="fa fa-arrow-left"></i> Back to Courses
          </Link>
        </div>
        <div className="course-detail-card">
          <div className="row g-0">
            <div className="col-lg-5">
              <div className="course-image-section">
                <img src={course.image} alt={course.title} />
              </div>
            </div>
            <div className="col-lg-7">
              <div className="course-detail-section">
                <h1 className="course-title">{course.title}</h1>
                <div className="description-box">
                  <h5>
                    <i className="fa fa-info-circle"></i> Course Description
                  </h5>
                  <div className="description-content">
                    {nl2lines(course.description).map((line, i) => (
                      <span key={i}>
                        {i > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="course-meta">
                  <div className="meta-item">
                    <i className="fa fa-play-circle"></i>
                    <span>{course.videoCount} Videos</span>
                  </div>
                  <div className="meta-item">
                    <i className="fa fa-clock"></i>
                    <span>Lifetime Access</span>
                  </div>
                  {course.hasCertificate && (
                    <div className="meta-item">
                      <i className="fa fa-certificate"></i>
                      <span>Certificate</span>
                    </div>
                  )}
                  <div className="meta-item">
                    <i className="fa fa-level-up-alt"></i>
                    <span>{course.level}</span>
                  </div>
                </div>
                <div className="price-section">
                  <div className="d-flex align-items-center flex-wrap">
                    <span className="current-price">{formatRupees(course.price)}</span>
                    {course.discountPercent > 0 && (
                      <>
                        <span className="original-price">{formatRupees(course.originalPrice, false)}</span>
                        <span className="discount-badge">{course.discountPercent}% OFF</span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    One-time payment. No recurring charges.
                  </p>
                </div>
                <div className="action-buttons">
                  {!loggedIn ? (
                    <>
                      <Link to="/login" className="btn btn-success btn-lg">
                        <i className="fa fa-shopping-cart"></i> Login to Purchase
                      </Link>{' '}
                      <Link to="/login" className="btn btn-outline">
                        <i className="fa fa-play-circle"></i> Login to Preview
                      </Link>
                    </>
                  ) : purchase?.canWatch ? (
                    <>
                      <button type="button" className="btn btn-success btn-lg view-playlist" onClick={() => onPlaylist()}>
                        <i className="fa fa-play-circle"></i> Start Learning
                      </button>{' '}
                      <Link to="/my-courses" className="btn btn-outline">
                        <i className="fa fa-book"></i> My Courses
                      </Link>
                    </>
                  ) : purchase?.status === 'pending' ? (
                    <>
                      <span className="btn btn-disabled btn-lg">
                        <i className="fa fa-clock"></i> Payment Pending Approval
                      </span>{' '}
                      <button type="button" className="btn btn-outline view-playlist" onClick={() => onPlaylist()}>
                        <i className="fa fa-play-circle"></i> View Playlist
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn-success btn-lg" id="buyNowBtn" onClick={onBuy}>
                        <i className="fa fa-shopping-cart"></i> Buy Now
                      </button>{' '}
                      <button type="button" className="btn btn-outline view-playlist" onClick={() => onPlaylist()}>
                        <i className="fa fa-play-circle"></i> View Playlist
                      </button>
                    </>
                  )}
                </div>
                {purchase?.status === 'rejected' && !purchase.canWatch && (
                  <div className="alert alert-danger mt-3 mb-0">
                    <i className="fa fa-exclamation-circle"></i> Your previous payment could not be verified. You can submit the payment again.
                  </div>
                )}
                <div className="features-list">
                  <h4 className="mb-3" style={{ color: '#2c3e50' }}>
                    What you'll get:
                  </h4>
                  <div className="feature-item">
                    <i className="fa fa-check-circle"></i> <span>Full lifetime access to all {course.videoCount} videos</span>
                  </div>
                  <div className="feature-item">
                    <i className="fa fa-check-circle"></i> <span>Downloadable resources and exercises</span>
                  </div>
                  <div className="feature-item">
                    <i className="fa fa-check-circle"></i> <span>Certificate of completion</span>
                  </div>
                  <div className="feature-item">
                    <i className="fa fa-check-circle"></i> <span>{'Q&A support from instructors'}</span>
                  </div>
                  <div className="feature-item">
                    <i className="fa fa-check-circle"></i> <span>Mobile and TV access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="videos-section">
          <h3 className="section-title">
            <i className="fa fa-list-ol"></i> Course Content ({course.videoCount} Videos)
          </h3>
          <div className="video-list">
            {videos?.map((v) => (
              <div
                key={v.id}
                className="video-item"
                role="button"
                tabIndex={0}
                onClick={() => onVideo(v)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onVideo(v)}
              >
                <div className="video-icon">
                  <i className="fa fa-play-circle"></i>
                </div>
                <div className="video-info">
                  <div className="video-title">
                    <strong>{v.order}.</strong> {v.title}
                  </div>
                  <div className="video-duration">
                    <i className="fa fa-clock"></i> {duration(v.durationSec)}
                  </div>
                </div>
                {v.isFree ? (
                  <span className="video-badge free-badge">
                    <i className="fa fa-unlock"></i> Free
                  </span>
                ) : v.canAccess ? (
                  <span className="video-badge unlocked-badge">
                    <i className="fa fa-unlock"></i> Unlocked
                  </span>
                ) : (
                  <span className="video-badge premium-badge">
                    <i className="fa fa-lock"></i> Premium
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
