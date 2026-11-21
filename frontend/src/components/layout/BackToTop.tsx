import { useScrollY } from '@/hooks/useScrollY';

/** Back-to-top button, visible after 400px of scrolling. */
export function BackToTop() {
  const scrollY = useScrollY();
  return (
    <button
      type="button"
      className={`back-to-top${scrollY > 400 ? ' show' : ''}`}
      id="backToTop"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <i className="fa fa-arrow-up"></i>
    </button>
  );
}
