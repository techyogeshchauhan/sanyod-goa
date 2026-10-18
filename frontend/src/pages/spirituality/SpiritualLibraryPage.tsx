import { usePageEffects } from '@/effects/usePageEffects';
import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/library.page.css';
import { setupLibraryEffects } from './library.effects';
import SpiritualLibraryContent from './SpiritualLibraryContent';

/** Spiritual Library (lab.php). */
export default function SpiritualLibraryPage() {
  useBodyClass('page-library');
  usePageEffects(setupLibraryEffects);
  return <SpiritualLibraryContent />;
}
