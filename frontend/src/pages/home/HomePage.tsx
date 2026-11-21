import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/api/courses';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAuth } from '@/providers/AuthProvider';
import '@/styles/pages/home.page.css';
import HomeContent from './HomeContent';

/** Home (index.php). */
export default function HomePage() {
  useBodyClass('page-home');
  const { user } = useAuth();
  const { data: courses } = useQuery({ queryKey: ['courses', 'home'], queryFn: coursesApi.home });
  return <HomeContent courses={courses} loggedIn={Boolean(user)} />;
}
