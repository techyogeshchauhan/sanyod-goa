import { useQuery } from '@tanstack/react-query';
import { Modal } from 'bootstrap';
import { useEffect, useRef, useState } from 'react';
import type { CourseVideo } from '@shared/types/catalog';
import { courseDetailApi } from '@/api/catalog';
import { useAuth } from '@/providers/AuthProvider';
import { purchaseRequired } from './dialogs';

interface Props {
  /** The course whose playlist is open, or null when closed. */
  course: { slug: string; title: string; priceText: string; videoCount: number; startWith?: string } | null;
  onClose: () => void;
  onPurchase: (slug: string) => void;
}

const embed = (id: string) => `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;

/**
 * "<course> - Playlist" modal (courses.php / course_details.php). The list replaces the HTML
 * that get_videos.php returned; locked videos open the live "Purchase Required!" dialog.
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

  // Auto-play the first available video, as live did after loading the list.
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
    <div className="modal fade" id="playlistModal" tabIndex={-1} aria-hidden="true" ref={ref}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content video-modal-content">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title" id="playlistModalTitle">
              {course ? `${course.title} - Playlist` : 'Playlist'}
            </h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body p-0">
            <div className="row g-0">
              <div className="col-md-8 p-0">
                {current ? (
                  <iframe
                    id="mainVideoPlayer"
                    width="100%"
                    height="400"
                    src={embed(current)}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Course video"
                  ></iframe>
                ) : (
                  <div className="d-flex align-items-center justify-content-center text-white-50 text-center p-4" style={{ height: 400, background: '#000' }}>
                    {videos && videos.length === 0 ? 'No videos in this course yet.' : (
                      <span>
                        <i className="fa fa-lock fa-2x mb-3 d-block"></i>
                        Purchase this course to unlock all videos
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="col-md-4 p-0">
                <div className="video-list bg-dark">
                  <div id="videoPlaylist" className="p-3">
                    {isLoading && (
                      <div className="text-center text-white p-3">
                        <i className="fas fa-spinner fa-spin"></i> Loading videos...
                      </div>
                    )}
                    {isError && <div className="text-center text-white p-3">Error loading videos</div>}
                    {videos?.length === 0 && <div className="text-center text-white p-3">No videos available</div>}
                    {videos?.map((v) => {
                      const state = v.isFree ? 'free' : v.canAccess ? 'unlocked' : 'paid';
                      return (
                        <div
                          key={v.id}
                          className={`video-item ${state} text-white`}
                          role="button"
                          tabIndex={0}
                          style={{ background: current && v.youtubeId === current ? '#2c3e50' : 'transparent' }}
                          onClick={() => play(v)}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && play(v)}
                        >
                          <i className={`fa ${v.canAccess ? 'fa-play-circle' : 'fa-lock'} me-2`}></i>
                          <strong>{v.order}.</strong> {v.title}
                          {state === 'free' && <span className="free-badge">FREE</span>}
                          {state === 'paid' && <span className="locked-badge">🔒 Premium</span>}
                          {state === 'unlocked' && <span className="unlocked-badge">Unlocked</span>}
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
    </div>
  );
}
