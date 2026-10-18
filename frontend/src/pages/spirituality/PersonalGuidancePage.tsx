import { useCallback, useState, type MouseEvent } from 'react';
import { usePageEffects } from '@/effects/usePageEffects';
import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/personal-guidance.page.css';
import { GuidanceConsultationModal, type BookingRequest } from './GuidanceConsultationModal';
import PersonalGuidanceContent from './PersonalGuidanceContent';
import { setupPersonalGuidanceEffects } from './personalGuidance.effects';

/** Personal Guidance (presonal.php). */
export default function PersonalGuidancePage() {
  useBodyClass('page-personal-guidance');
  usePageEffects(setupPersonalGuidanceEffects);
  const [booking, setBooking] = useState<BookingRequest | null>(null);

  const book = useCallback(
    (request: BookingRequest) => (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setBooking(request);
    },
    [],
  );

  return (
    <>
      <PersonalGuidanceContent book={book} />
      {booking && <GuidanceConsultationModal request={booking} onClose={() => setBooking(null)} />}
    </>
  );
}
