// Generated from reference/live-html/courses.html by scripts/html-to-jsx.mjs, then edited by hand:
// the cards come from GET /api/courses. Markup, classes and texts match the live page;
// styles: src/styles/pages/courses.page.css
import { Link } from 'react-router-dom';
import type { CourseSummary } from '@shared/types/course';
import { formatRupees, previewByBytes } from '@shared/utils/text';

export type CourseState = 'none' | 'pending' | 'owned';

interface Props {
  courses: CourseSummary[] | undefined;
  isLoading: boolean;
  loggedIn: boolean;
  stateOf: (course: CourseSummary) => CourseState;
  onPlaylist: (course: CourseSummary) => void;
}

export default function CoursesContent({ courses, isLoading, loggedIn, stateOf, onPlaylist }: Props) {
  return (
    <section style={{ background: '#f0f0f0', padding: '40px 0' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h2 className="otto" style={{ fontSize: '30px' }}>
            <i className="fa fa-tv"></i> <b>COURSES PLAYLIST</b>
          </h2>
          {loggedIn ? (
            <Link to="/my-courses" className="btn btn-primary">
              <i className="fa fa-book"></i> My Courses
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary">
              <i className="fa fa-sign-in-alt"></i> Login to Access Courses
            </Link>
          )}
        </div>
        <div className="row">
          {isLoading && (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          {courses?.map((course) => {
            const state = stateOf(course);
            return (
              <div className="col-lg-4 col-md-6 mb-4" key={course.id}>
                <div className="subject-card">
                  <div className="subject-image">
                    <Link to={`/courses/${course.slug}`}>
                      <img src={course.image} alt={course.title} />
                    </Link>
                  </div>
                  <div className="subject-info">
                    <h3 className="subject-title">{course.title}</h3>
                    <p className="subject-description">{previewByBytes(course.description, 100)}</p>
                    <div className="price-section">
                      <div>
                        <span className="price">{formatRupees(course.price)}</span>{' '}
                        {course.discountPercent > 0 && <span className="discount">{course.discountPercent}% OFF</span>}
                      </div>
                      <span className="video-count">{course.videoCount} Videos</span>
                    </div>
                    <div className="action-buttons">
                      <button className="btn btn-primary view-playlist" type="button" onClick={() => onPlaylist(course)}>
                        <i className="fa fa-play-circle"></i> View Playlist
                      </button>{' '}
                      {!loggedIn ? (
                        <Link to="/login" className="btn btn-success">
                          <i className="fa fa-shopping-cart"></i> Login to Buy
                        </Link>
                      ) : state === 'owned' ? (
                        <span className="btn btn-disabled">
                          <i className="fa fa-check-circle"></i> Purchased
                        </span>
                      ) : state === 'pending' ? (
                        <span className="btn btn-disabled">
                          <i className="fa fa-clock"></i> Pending Approval
                        </span>
                      ) : (
                        <Link to={`/courses/${course.slug}`} className="btn btn-success">
                          <i className="fa fa-shopping-cart"></i> Buy Now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
