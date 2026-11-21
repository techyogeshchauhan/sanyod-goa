import { useQuery } from '@tanstack/react-query';
import { Modal } from 'bootstrap';
import { useEffect, useRef, useState } from 'react';
import type { CourseVideo } from '@shared/types/catalog';
import { courseDetailApi } from '@/api/catalog';
import { useAuth } from '@/providers/AuthProvider';
import { duration } from '@/utils/format';
import { purchaseRequired } from './dialogs';

interface Props {
  /** The course whose playlist is open, or null when closed. */
  course: { slug: string; title: string; priceText: string; videoCount: number; startWith?: string } | null;
  onClose: () => void;
  onPurchase: (slug: string) => void;
}

const embed = (id: string) => `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;

/**
 * Course playlist (courses.php / course_details.php): player + video list. Free videos and
 * videos of owned courses play; locked ones offer the purchase.
 */
export function PlaylistModal({ course, onClose, onPurchase }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: videos, isLoading, isError } = useQuery({
    queryKey: ['course-videos', course?.slug, Boolean(user)],
    queryFn: () => courseDetailApi.videos(course?.slug ?? ''),
    enabled: Boolean(course),
  });

  // Open/close the Bootstrap modal with the `course` prop; stop the video when it closes.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const modal = Modal.getOrCreateInstance(el);
    const hidden = () => {
      setCurrent(null);
      onClose();
    };
    el.addEventListener('hidden.bs.modal', hidden);
    if (course) modal.show();
    else modal.hide();
    return () => el.removeEventListener('hidden.bs.modal', hidden);
  }, [course, onClose]);

  useEffect(() => () => Modal.getInstance(ref.current as HTMLElement)?.dispose(), []);

  // Start with the requested video, or the first one the viewer may watch.
  useEffect(() => {
    if (!course || !videos) return;
    const start = course.startWith ? videos.find((v) => v.id === course.startWith && v.canAccess) : undefined;
    const first = start ?? videos.find((v) => v.canAccess && v.youtubeId);
    setCurrent(first?.youtubeId ?? null);
  }, [course, videos]);

  async function play(video: CourseVideo) {
    if (!video.canAccess || !video.youtubeId) {
      if (!course) return;
      Modal.getInstance(ref.current as HTMLElement)?.hide();
      if (await purchaseRequired(course.priceText, course.videoCount)) onPurchase(course.slug);
      return;
    }
    setCurrent(video.youtubeId);
  }

  return (
    <div className="modal fade" id="playlistModal" tabIndex={-1} aria-hidden="true" aria-labelledby="playlistModalTitle" ref={ref}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="playlistModalTitle">
              {course ? course.title : 'Playlist'}
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body p-0">
            <div className="row g-0">
              <div className="col-lg-8 bg-dark">
                <div className="ratio ratio-16x9">
                  {current ? (
                    <iframe
                      id="mainVideoPlayer"
                      src={embed(current)}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Course video"
                    ></iframe>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center text-center p-4" style={{ color: '#b9b2c6' }}>
                      {videos && videos.length === 0 ? (
                        'No videos in this course yet.'
                      ) : (
                        <span>
                          <i className="fa fa-lock fa-2x mb-3 d-block"></i>
                          Purchase this course to unlock all videos
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-lg-4">
                <div className="playlist-list" id="videoPlaylist">
                  {isLoading && (
                    <div className="text-center text-muted p-4">
                      <i className="fas fa-spinner fa-spin"></i> Loading videos…
                    </div>
                  )}
                  {isError && <div className="text-center text-muted p-4">Error loading videos</div>}
                  {videos?.length === 0 && <div className="text-center text-muted p-4">No videos available</div>}
                  {videos?.map((v) => {
                    const state = v.isFree ? 'free' : v.canAccess ? 'unlocked' : 'paid';
                    return (
                      <div
                        key={v.id}
                        className={`video-row video-item ${state} ${v.canAccess ? 'open' : 'locked'}${current && v.youtubeId === current ? ' current' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => play(v)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && play(v)}
                      >
                        <span className="num">{v.canAccess ? v.order : <i className="fas fa-lock" style={{ fontSize: '0.75rem' }}></i>}</span>
                        <span className="title small">{v.title}</span>
                        {state === 'free' ? <span className="chip sage">Free</span> : <span className="small text-muted">{duration(v.durationSec)}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
