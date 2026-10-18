import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { DoctorCategory } from '@shared/types/catalog';
import { healthApi } from '@/api/catalog';
import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/health.page.css';
import HealthContent from './HealthContent';

/** Health Consultation Portal (health.php). */
export default function HealthPage() {
  useBodyClass('page-health');
  const [active, setActive] = useState<DoctorCategory>('physical');
  const { data, isLoading } = useQuery({ queryKey: ['doctors'], queryFn: healthApi.doctors });
  return <HealthContent doctors={data} isLoading={isLoading} active={active} onTab={setActive} />;
}
