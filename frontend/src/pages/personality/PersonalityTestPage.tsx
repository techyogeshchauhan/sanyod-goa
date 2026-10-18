import { useEffect } from 'react';
import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/personality-test.page.css';
import PersonalityTestContent from './PersonalityTestContent';
import { setupPersonalityTest } from './personalityTest.legacy';

/** Prakriti / Guna personality test (Personality_Test.php). Runs fully in the browser. */
export default function PersonalityTestPage() {
  useBodyClass('page-personality-test');
  useEffect(() => {
    setupPersonalityTest();
  }, []);
  return <PersonalityTestContent />;
}
