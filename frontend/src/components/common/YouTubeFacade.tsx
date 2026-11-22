import { useState } from 'react';

/**
 * A YouTube video that loads the real player only when the visitor presses play. The embed alone
 * pulls in ~0.5 MB of player script and a dozen requests, even if nobody watches; until then this
 * shows the video's thumbnail and a play button.
 */
export function YouTubeFacade({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    );
  }

  return (
    <button type="button" className="yt-facade" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
      <span className="yt-facade-play" aria-hidden="true">
        <i className="fas fa-play"></i>
      </span>
    </button>
  );
}
