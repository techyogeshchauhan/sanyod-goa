import { useCallback, useState } from 'react';
import { Avatar, CtaBand, FeatureCard, PageHero, QuoteCard, Section, type Tone } from '@/components/ui';
import { GuidanceConsultationModal, type BookingRequest } from './GuidanceConsultationModal';

const PATH: { icon: string; title: string; text: string; tone: Tone }[] = [
  { icon: 'fas fa-search', title: 'Self-Assessment', text: 'Understand your current spiritual state and identify growth areas', tone: 'indigo' },
  { icon: 'fas fa-user-tie', title: 'Mentor Matching', text: 'Connect with the perfect mentor for your spiritual journey', tone: 'saffron' },
  { icon: 'fas fa-road', title: 'Personalized Plan', text: 'Receive a customized spiritual practice plan', tone: 'sage' },
  { icon: 'fas fa-chart-line', title: 'Ongoing Support', text: 'Regular check-ins and guidance adjustments', tone: 'gold' },
];

const MENTORS: { key: NonNullable<BookingRequest['mentor']>; name: string; badge: string; tagline: string; text: string; rating: string }[] = [
  {
    key: 'swami',
    name: 'Swami Devanand',
    badge: 'Vedanta & Meditation',
    tagline: '25+ years in spiritual guidance',
    text: 'Specializes in Advaita Vedanta, meditation techniques, and spiritual counseling for modern life.',
    rating: '4.9 (124 reviews)',
  },
  {
    key: 'priya',
    name: 'Dr. Priya Sharma',
    badge: 'Yoga & Ayurveda',
    tagline: 'PhD in Yoga Psychology',
    text: 'Expert in therapeutic yoga, pranayama, and Ayurvedic lifestyle guidance.',
    rating: '4.8 (98 reviews)',
  },
  {
    key: 'rajan',
    name: 'Acharya Rajan',
    badge: 'Scripture & Rituals',
    tagline: 'Vedic Scholar & Ritual Expert',
    text: 'Deep knowledge of scriptures, rituals, and practical spirituality for daily life.',
    rating: '4.9 (156 reviews)',
  },
];

const PROCESS = [
  {
    title: 'Initial Assessment Session',
    text: 'A comprehensive 60-minute session where we understand your spiritual background, current practices, challenges, and aspirations. This helps us create a personalized spiritual profile.',
  },
  {
    title: 'Customized Practice Plan',
    text: 'Based on your assessment, we create a personalized spiritual practice plan that includes meditation techniques, study materials, rituals, and lifestyle adjustments specifically tailored for you.',
  },
  {
    title: 'Regular Guidance Sessions',
    text: 'Weekly or bi-weekly one-on-one sessions with your mentor to discuss progress, address challenges, deepen understanding, and adjust practices as needed.',
  },
  {
    title: 'Ongoing Support & Community',
    text: 'Access to our spiritual community, regular check-ins, email support, and resources to ensure continuous growth and support throughout your journey.',
  },
];

const PLANS: { plan: NonNullable<BookingRequest['plan']>; icon: string; badge: string; title: string; text: string; price: string; per: string; note?: string; cta: string; featured?: boolean }[] = [
  {
    plan: 'one-on-one',
    icon: 'fas fa-video',
    badge: 'Most Popular',
    title: 'One-on-One Video Sessions',
    text: 'Private video sessions with your chosen mentor for personalized guidance',
    price: '₹999',
    per: '/session',
    cta: 'Book now',
    featured: true,
  },
  {
    plan: 'monthly',
    icon: 'fas fa-calendar-alt',
    badge: 'Monthly Plan',
    title: 'Monthly Mentorship',
    text: '4 sessions per month with ongoing support and practice plans',
    price: '₹3,499',
    per: '/month',
    note: 'Save ₹497',
    cta: 'Subscribe',
  },
  {
    plan: 'group',
    icon: 'fas fa-users',
    badge: 'Group Session',
    title: 'Group Guidance',
    text: 'Small group sessions (max 5 people) for shared learning and support',
    price: '₹499',
    per: '/session',
    cta: 'Join group',
  },
];

const TESTIMONIALS = [
  { q: "Swami Devanand's guidance transformed my meditation practice from struggle to joy. I've found peace I never knew was possible.", name: 'Rahul Mehta', note: '6 months of mentorship' },
  { q: 'The personalized yoga plan from Dr. Priya helped me overcome chronic back pain and find spiritual connection through movement.', name: 'Anjali Singh', note: '4 months of guidance' },
  { q: "Acharya Rajan's explanations of rituals gave them deep meaning. My daily practice has become truly transformative.", name: 'Vikram Joshi', note: '8 months of mentorship' },
  { q: 'The monthly mentorship plan gave me consistency. My spiritual practice is now a non-negotiable part of my life.', name: 'Priya Desai', note: '1 year of guidance' },
];

const FAQ = [
  {
    q: 'How do I choose the right mentor for me?',
    a: 'We provide detailed mentor profiles, introductory videos, and offer a complimentary 15-minute consultation call to help you find the perfect match for your spiritual journey.',
  },
  {
    q: 'What if I need to change mentors?',
    a: "We understand that spiritual needs evolve. You can request a mentor change at any time, and we'll help you transition smoothly to a better-matched guide.",
  },
  {
    q: 'How often should I have guidance sessions?',
    a: "Most students benefit from weekly or bi-weekly sessions initially, then transition to monthly check-ins as their practice becomes established. We'll recommend a frequency based on your assessment.",
  },
  {
    q: 'Is the guidance suitable for beginners?',
    a: 'Absolutely! Our mentors are experienced in guiding complete beginners. We start exactly where you are and progress at your comfortable pace.',
  },
  {
    q: 'What happens between sessions?',
    a: "You'll receive personalized practices to work on, access to our resource library, and can email your mentor with questions that arise between sessions.",
  },
];

/** Personal Guidance (presonal.php): every booking button opens the free consultation form. */
export default function PersonalGuidancePage() {
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const book = useCallback((request: BookingRequest) => () => setBooking(request), []);
  const close = useCallback(() => setBooking(null), []);

  return (
    <>
      <PageHero
        center
        crumbs={[{ label: 'Spirituality' }, { label: 'Personal Guidance' }]}
        deva="गुरुकृपा हि केवलम्"
        title="Personal Guidance"
        lead="Receive personalized spiritual guidance from experienced mentors. Transform your spiritual journey with one-on-one mentorship tailored to your unique path and aspirations."
        actions={
          <>
            <a href="#mentors" className="btn btn-light btn-lg">
              <i className="fas fa-user-tie text-saffron"></i> Meet our mentors
            </a>
            <button type="button" className="btn btn-primary btn-lg" onClick={book({})}>
              <i className="fas fa-calendar-check"></i> Book consultation
            </button>
          </>
        }
      >
        <p className="text-muted small mt-4 mb-0">
          <i className="fas fa-quote-left me-2 text-saffron"></i>
          When the student is ready, the teacher appears
        </p>
      </PageHero>

      <Section deva="मार्गदर्शन मार्ग" title="Your spiritual guidance path" lead="Discover how personalized guidance can accelerate your spiritual growth.">
        <div className="row g-3 g-md-4 grid-compact">
          {PATH.map((p) => (
            <div className="col-6 col-lg-3" key={p.title}>
              <FeatureCard icon={p.icon} title={p.title} text={p.text} tone={p.tone} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="mentors" tone="alt" deva="गुरुवर्याः" title="Meet our spiritual mentors" lead="Learn from experienced guides who have walked the path themselves.">
        <div className="row g-4">
          {MENTORS.map((m) => (
            <div className="col-md-6 col-lg-4" key={m.key}>
              <div className="card-soft hover reveal d-flex flex-column">
                <div className="d-flex gap-3 align-items-center mb-3">
                  <Avatar name={m.name} size="lg" />
                  <div>
                    <h3 className="h4 mb-1">{m.name}</h3>
                    <div className="small text-muted">{m.tagline}</div>
                  </div>
                </div>
                <span className="chip indigo align-self-start mb-3">{m.badge}</span>
                <p className="text-muted">{m.text}</p>
                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <span className="small text-muted">
                    <i className="fas fa-star text-warning me-1"></i>
                    {m.rating}
                  </span>
                  <button type="button" className="btn btn-primary btn-sm" onClick={book({ mentor: m.key })}>
                    Book session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <button type="button" className="btn btn-light" onClick={book({ mentor: 'any' })}>
            <i className="fas fa-users text-saffron"></i> Any available mentor
          </button>
        </div>
      </Section>

      <Section id="process" deva="प्रक्रिया" title="How personal guidance works" lead="A structured approach to your spiritual development.">
        <div className="container-narrow steps">
          {PROCESS.map((s, i) => (
            <div className="card-soft reveal step" key={s.title}>
              <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="h4">{s.title}</h3>
                <p className="text-muted mb-0">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="alt" deva="व्यक्तिगत सत्र" title="Personal guidance sessions" lead="Choose the guidance format that works best for you.">
        <div className="row g-4 align-items-stretch">
          {PLANS.map((p) => (
            <div className="col-md-4" key={p.plan}>
              <div className={`card-soft hover reveal d-flex flex-column ${p.featured ? 'plan-featured' : ''}`}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <span className="icon-badge mb-0">
                    <i className={p.icon}></i>
                  </span>
                  <span className={`chip ${p.featured ? 'solid' : 'muted'}`}>{p.badge}</span>
                </div>
                <h3 className="h4">{p.title}</h3>
                <p className="text-muted">{p.text}</p>
                <div className="my-3">
                  <span className="price">{p.price}</span>
                  <span className="text-muted ms-1">{p.per}</span>
                  {p.note && <div className="small text-sage fw-600 mt-1">{p.note}</div>}
                </div>
                <button type="button" className={`btn ${p.featured ? 'btn-primary' : 'btn-outline-primary'} w-100 mt-auto`} onClick={book({ plan: p.plan })}>
                  {p.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section deva="शिष्य अनुभव" title="Transformative experiences" lead="Hear from those who have walked this path with guidance.">
        <div className="row g-4">
          {TESTIMONIALS.map((t) => (
            <div className="col-md-6" key={t.name}>
              <QuoteCard quote={`“${t.q}”`}>
                <div className="d-flex align-items-center gap-3 mt-3">
                  <Avatar name={t.name} />
                  <div>
                    <div className="fw-600 text-ink">{t.name}</div>
                    <div className="small text-muted">{t.note}</div>
                  </div>
                </div>
              </QuoteCard>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="alt" deva="प्रश्नोत्तर" title="Frequently asked questions" lead="Get answers to common questions about personal spiritual guidance.">
        <div className="container-narrow faq reveal">
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <div className="text-center mt-4">
          <button type="button" className="btn btn-ink" onClick={book({})}>
            <i className="fas fa-comment-alt"></i> Ask your question
          </button>
        </div>
      </Section>

      <section className="section">
        <div className="container">
          <CtaBand
            deva="गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः"
            title="Begin your guided spiritual journey today"
            lead="Take the first step towards transformative spiritual growth with personalized guidance from experienced mentors who understand your unique path."
            actions={
              <button type="button" className="btn btn-primary btn-lg" onClick={book({})}>
                <i className="fas fa-calendar-plus"></i> Book free consultation
              </button>
            }
          >
            <div className="stat-row mt-4 mx-auto" style={{ maxWidth: 560 }}>
              {[
                ['500+', 'Students guided'],
                ['4.8/5', 'Average rating'],
                ['96%', 'Satisfaction rate'],
              ].map(([v, l]) => (
                <div className="stat py-0" key={l}>
                  <div className="value text-white">{v}</div>
                  <div className="label" style={{ color: '#b9b2c6' }}>
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </CtaBand>
        </div>
      </section>

      {booking && <GuidanceConsultationModal request={booking} onClose={close} />}
    </>
  );
}
