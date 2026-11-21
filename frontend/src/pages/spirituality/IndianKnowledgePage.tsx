import { Link } from 'react-router-dom';
import { Avatar, CtaBand, FeatureCard, FitImage, PageHero, QuoteCard, Section, type Tone } from '@/components/ui';

const STOCK = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

const PATHS: { icon: string; title: string; text: string; tone: Tone }[] = [
  { icon: 'fas fa-brain', title: 'Jnana Yoga', text: 'The path of knowledge and wisdom through self-inquiry', tone: 'indigo' },
  { icon: 'fas fa-heart', title: 'Bhakti Yoga', text: 'The path of devotion and loving surrender to the Divine', tone: 'rose' },
  { icon: 'fas fa-hands', title: 'Karma Yoga', text: 'The path of selfless action without attachment to results', tone: 'saffron' },
  { icon: 'fas fa-spa', title: 'Raja Yoga', text: 'The royal path of meditation and mind control', tone: 'sage' },
];

const SCRIPTURES = [
  { tag: 'Vedas', title: 'The Four Vedas', text: 'The oldest scriptures of Hinduism containing eternal spiritual knowledge' },
  { tag: 'Upanishads', title: 'Upanishads', text: 'Philosophical texts discussing meditation, consciousness and ultimate reality' },
  { tag: 'Gita', title: 'Bhagavad Gita', text: 'The divine dialogue between Krishna and Arjuna on duty and spirituality' },
  { tag: 'Yoga Sutras', title: 'Yoga Sutras', text: "Patanjali's guide to meditation and spiritual liberation" },
];

const MEDITATION: { icon: string; title: string; text: string; cta: string; tone: Tone }[] = [
  { icon: 'fas fa-circle-notch', title: 'Chakra Meditation', text: 'Balance your energy centers through guided meditation', cta: 'Begin meditation', tone: 'indigo' },
  { icon: 'fas fa-om', title: 'Mantra Meditation', text: 'Experience the power of sacred sounds and vibrations', cta: 'Begin meditation', tone: 'saffron' },
  { icon: 'fas fa-wind', title: 'Pranayama', text: 'Master the art of breath control for mental clarity', cta: 'Begin practice', tone: 'sky' },
];

const TEACHERS = [
  { name: 'Adi Shankaracharya', badge: 'Advaita Vedanta', text: '8th century philosopher who consolidated Advaita Vedanta', tags: ['Non-dualism', 'Self-Realization'] },
  { name: 'Swami Vivekananda', badge: 'Modern Yoga', text: 'Introduced Yoga and Vedanta to the Western world', tags: ['Raja Yoga', 'Practical Vedanta'] },
];

const QUOTES = [
  { q: 'You are not the body, nor the mind, but the eternal consciousness.', c: 'Ashtavakra Gita' },
  { q: 'Yoga is the journey of the self, through the self, to the self.', c: 'Bhagavad Gita' },
  { q: 'The mind is everything. What you think, you become.', c: 'Gautama Buddha' },
  { q: 'See the Divine in every being, and serve the Divine in all.', c: 'Sri Ramakrishna' },
];

/** Indian Spiritual Knowledge (ind_know.php). */
export default function IndianKnowledgePage() {
  return (
    <>
      <PageHero
        center
        crumbs={[{ label: 'Spirituality' }, { label: 'Indian Knowledge' }]}
        deva="आत्मानं विद्धि"
        title="Indian Spiritual Knowledge"
        lead="Journey through the sacred teachings of Vedas, Upanishads, Bhagavad Gita, and Yoga Sutras. Discover the path to self-realization and eternal bliss."
        actions={
          <>
            <a href="#wisdom" className="btn btn-primary btn-lg">
              <i className="fas fa-book-open"></i> Begin your journey
            </a>
            <a href="#teachings" className="btn btn-light btn-lg">
              <i className="fas fa-scroll text-saffron"></i> Sacred scriptures
            </a>
          </>
        }
      >
        <p className="text-muted small mt-4 mb-0">
          <span className="deva">“योगस्थः कुरु कर्माणि”</span> — Perform your duty established in Yoga (Bhagavad Gita 2.48)
        </p>
      </PageHero>

      <Section id="wisdom" deva="ज्ञानमार्गः" title="Paths of spiritual wisdom" lead="Discover the four traditional paths to spiritual enlightenment.">
        <div className="row g-4">
          {PATHS.map((p) => (
            <div className="col-sm-6 col-lg-3" key={p.title}>
              <FeatureCard icon={p.icon} title={p.title} text={p.text} tone={p.tone} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="teachings" tone="alt" deva="पवित्र ग्रन्थाः" title="Sacred scriptures" lead="Explore the eternal wisdom of India's spiritual literature.">
        <div className="row g-4">
          {SCRIPTURES.map((s) => (
            <div className="col-sm-6 col-lg-3" key={s.title}>
              <article className="card-soft card-media hover reveal">
                <div className="media">
                  <span className="media-tag chip solid">{s.tag}</span>
                  <FitImage src={STOCK} loading="lazy" />
                </div>
                <div className="body">
                  <h3 className="h4">{s.title}</h3>
                  <p className="text-muted small">{s.text}</p>
                  <Link to="/spirituality/library" className="btn btn-outline-primary btn-sm mt-auto align-self-start">
                    Study now
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      </Section>

      <Section deva="ध्यान मार्गः" title="Meditation & inner peace" lead="Learn ancient meditation techniques for modern life.">
        <div className="row g-4 justify-content-center">
          {MEDITATION.map((m) => (
            <div className="col-md-4" key={m.title}>
              <FeatureCard icon={m.icon} title={m.title} text={m.text} tone={m.tone}>
                <Link to="/courses" className="btn btn-light btn-sm mt-3">
                  {m.cta}
                </Link>
              </FeatureCard>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="alt" deva="आचार्याः" title="Eminent spiritual teachers" lead="Learn from the masters who preserved and propagated spiritual wisdom.">
        <div className="row g-4">
          {TEACHERS.map((t) => (
            <div className="col-md-6" key={t.name}>
              <div className="card-soft reveal d-flex gap-3">
                <Avatar name={t.name} size="lg" />
                <div>
                  <span className="chip indigo mb-2">{t.badge}</span>
                  <h3 className="h4 mb-1">{t.name}</h3>
                  <p className="text-muted">{t.text}</p>
                  <div className="d-flex gap-2 flex-wrap">
                    {t.tags.map((tag) => (
                      <span className="chip muted" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section deva="वचनामृतम्" title="Eternal wisdom quotes" lead="Timeless teachings from Indian spiritual masters.">
        <div className="row g-4">
          {QUOTES.map((q) => (
            <div className="col-md-6" key={q.c}>
              <QuoteCard quote={`“${q.q}”`} cite={`— ${q.c}`} />
            </div>
          ))}
        </div>
      </Section>

      <section className="section pt-0">
        <div className="container">
          <CtaBand
            deva="सर्वं ज्ञानं मयि विद्यते"
            title="Begin your spiritual journey today"
            lead="Join thousands of seekers who have transformed their lives through Indian spiritual wisdom."
            actions={
              <>
                <Link to="/courses" className="btn btn-primary btn-lg">
                  <i className="fas fa-user-plus"></i> Enroll now
                </Link>
                <Link to="/spirituality/personal-guidance" className="btn btn-outline-light btn-lg">
                  <i className="fas fa-comments"></i> Free consultation
                </Link>
              </>
            }
          />
        </div>
      </section>
    </>
  );
}
