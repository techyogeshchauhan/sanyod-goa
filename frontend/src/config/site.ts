// Site details shown in the header/footer (same values as the live site).
// Later served by GET /api/settings/public and editable by a super admin (docs/09 settings).
export const SITE = {
  name: 'SANYOD',
  tagline: 'Sankhya Yog Darshan',
  defaultTitle: 'Sankhya Yog Darshan - Yoga, Spirituality & Personal Growth',
  location: 'Mapusa, Goa',
  phone: '8077641645',
  email: 'sanyod@sanyod.in',
  logo: '/images/WhatsApp-Image-2026-01-20-at-10.04.38-AM-Photoroom.png',
  workingHours: [
    { label: 'Mon - Friday:', value: '09.00 am to 07.00 pm' },
    { label: 'Saturday:', value: '10.00 am to 05.00 pm' },
    { label: 'Vacation:', value: 'All Sunday is our vacation' },
  ],
  // Live links are placeholders ("#"); kept until real profiles are provided (docs/14 Q17).
  social: { facebook: '#', twitter: '#', instagram: '#', linkedin: '#' },
} as const;
