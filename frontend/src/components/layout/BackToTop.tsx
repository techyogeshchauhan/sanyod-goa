import { useScrollY } from '@/hooks/useScrollY';

/** Back-to-top button: visible after 300px of scrolling (footer.php script). */
export function BackToTop() {
  const scrollY = useScrollY();
  return (
    <a
      href="#"
      className={`back-to-top${scrollY > 300 ? ' show' : ''}`}
      id="backToTop"
      aria-label="Back to top"
      onClick={(e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      <i className="fa fa-arrow-up"></i>
    </a>
  );
}
