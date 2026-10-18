import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/about.page.css';
import AboutContent from './AboutContent';

/** About (about.php). */
export default function AboutPage() {
  useBodyClass('page-about');
  return <AboutContent />;
}
