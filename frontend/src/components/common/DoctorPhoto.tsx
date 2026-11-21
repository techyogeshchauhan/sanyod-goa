import { useState } from 'react';
import { FitImage } from '@/components/ui';

// Neutral avatar shown when a doctor has no photo, or the photo file is missing.
const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e8f4fc"/><circle cx="60" cy="46" r="22" fill="#9cc9e6"/><path d="M18 112c4-24 22-36 42-36s38 12 42 36" fill="#9cc9e6"/></svg>',
  );

/** Doctor photo, shown whole inside its frame (.doctor-avatar / .doctor-photo-lg). */
export function DoctorPhoto({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  return <FitImage src={!src || failed ? FALLBACK : src} alt={alt} onError={() => setFailed(true)} />;
}
