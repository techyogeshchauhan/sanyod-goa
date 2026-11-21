import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CourseSummary } from '@shared/types/course';
import { formatRupees, previewByBytes } from '@shared/utils/text';

/** Course card: image, title, short description, price and actions. */
export function CourseCard({
  course,
  tag,
  meta,
  children,
}: {
  course: CourseSummary;
  /** Small label over the image (NEW, POPULAR, Purchased …). */
  tag?: ReactNode;
  /** Replaces the price line (e.g. purchase date in My Courses). */
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="card-soft card-media hover reveal">
      <Link to={`/courses/${course.slug}`} className="media" aria-label={course.title}>
        {tag && <span className="media-tag">{tag}</span>}
        <img src={course.image} alt="" loading="lazy" />
      </Link>
      <div className="body">
        <div className="d-flex gap-2 flex-wrap mb-2">
          <span className="chip muted">
            <i className="fas fa-play-circle"></i> {course.videoCount} videos
          </span>
          <span className="chip muted">{course.level}</span>
        </div>
        <h3 className="h4 subject-title">
          <Link to={`/courses/${course.slug}`} className="text-ink">
            {course.title.trim()}
          </Link>
        </h3>
        <p className="text-muted small mb-3">{previewByBytes(course.description.trim(), 110)}</p>
        <div className="mt-auto">
          {meta ?? (
            <div className="d-flex align-items-baseline gap-2 mb-3">
              <span className="price">{formatRupees(course.price)}</span>
              {course.discountPercent > 0 && (
                <>
                  <span className="price-old">{formatRupees(course.originalPrice, false)}</span>
                  <span className="chip sage">{course.discountPercent}% off</span>
                </>
              )}
            </div>
          )}
          {children && <div className="d-flex gap-2 flex-wrap">{children}</div>}
        </div>
      </div>
    </article>
  );
}
