import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi } from '@/api/courses';
import { usePageEffects } from '@/effects/usePageEffects';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import '@/styles/pages/home.page.css';
import { setupHomeCourseCardEffects, setupHomeEffects } from './home.effects';
import HomeContent from './HomeContent';

/** Home (index.php). */
export default function HomePage() {
  useBodyClass('page-home');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: courses } = useQuery({ queryKey: ['courses', 'home'], queryFn: coursesApi.home });

  usePageEffects(setupHomeEffects);
  usePageEffects(setupHomeCourseCardEffects, [courses]);

  const go = useCallback((to: string) => navigate(to), [navigate]);
  return <HomeContent go={go} courses={courses} loggedIn={Boolean(user)} />;
}
