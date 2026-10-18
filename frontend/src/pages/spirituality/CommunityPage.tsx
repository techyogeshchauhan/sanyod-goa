import { usePageEffects } from '@/effects/usePageEffects';
import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/community.page.css';
import CommunityContent from './CommunityContent';
import { setupCommunityEffects } from './community.effects';

/** Community & Satsanga (counity.php). */
export default function CommunityPage() {
  useBodyClass('page-community');
  usePageEffects(setupCommunityEffects);
  return <CommunityContent />;
}
