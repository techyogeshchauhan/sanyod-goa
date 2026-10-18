import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/peace-building.page.css';
import PeaceBuildingContent from './PeaceBuildingContent';

/** Peace Building and Global Collaboration (Peace_Building.php). */
export default function PeaceBuildingPage() {
  useBodyClass('page-peace-building');
  return (
    <main className="peace-building-content">
      <PeaceBuildingContent />
    </main>
  );
}
