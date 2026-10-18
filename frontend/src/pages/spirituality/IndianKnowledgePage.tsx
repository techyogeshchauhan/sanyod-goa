import { usePageEffects } from '@/effects/usePageEffects';
import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/ind-know.page.css';
import IndianKnowledgeContent from './IndianKnowledgeContent';
import { setupIndianKnowledgeEffects } from './indianKnowledge.effects';

/** Indian Knowledge Wisdom (ind_know.php). */
export default function IndianKnowledgePage() {
  useBodyClass('page-ind-know');
  usePageEffects(setupIndianKnowledgeEffects);
  return <IndianKnowledgeContent />;
}
