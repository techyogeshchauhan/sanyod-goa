import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CtaBand, PageHero, Section, type Tone } from '@/components/ui';
import { useBodyClass } from '@/hooks/useBodyClass';
import '@/styles/pages/indian-knowledge.page.css';

const PATHS: { icon: string; title: string; deva: string; text: string; tone: Tone }[] = [
  { icon: 'fas fa-brain', title: 'Jnana Yoga', deva: 'ज्ञान योग', text: 'The path of knowledge and wisdom through self-inquiry', tone: 'indigo' },
  { icon: 'fas fa-heart', title: 'Bhakti Yoga', deva: 'भक्ति योग', text: 'The path of devotion and loving surrender to the Divine', tone: 'rose' },
  { icon: 'fas fa-hands', title: 'Karma Yoga', deva: 'कर्म योग', text: 'The path of selfless action without attachment to results', tone: 'saffron' },
  { icon: 'fas fa-spa', title: 'Raja Yoga', deva: 'राज योग', text: 'The royal path of meditation and mind control', tone: 'sage' },
];

const SCRIPTURES: { tag: string; deva: string; title: string; text: string; facts: string; tone: Tone }[] = [
  { tag: 'Vedas', deva: 'वेद', title: 'The Four Vedas', text: 'The oldest scriptures of Hinduism containing eternal spiritual knowledge', facts: 'Rig · Yajur · Sama · Atharva', tone: 'saffron' },
  { tag: 'Upanishads', deva: 'उपनिषद्', title: 'Upanishads', text: 'Philosophical texts discussing meditation, consciousness and ultimate reality', facts: '108 traditional texts', tone: 'indigo' },
  { tag: 'Gita', deva: 'भगवद्गीता', title: 'Bhagavad Gita', text: 'The divine dialogue between Krishna and Arjuna on duty and spirituality', facts: '18 chapters · 700 verses', tone: 'rose' },
  { tag: 'Yoga Sutras', deva: 'योगसूत्र', title: 'Yoga Sutras', text: "Patanjali's guide to meditation and spiritual liberation", facts: '4 padas · 196 sutras', tone: 'sage' },
];

const MEDITATION: { icon: string; title: string; text: string; cta: string; tone: Tone }[] = [
  { icon: 'fas fa-circle-notch', title: 'Chakra Meditation', text: 'Balance your energy centers through guided meditation', cta: 'Begin meditation', tone: 'indigo' },
  { icon: 'fas fa-om', title: 'Mantra Meditation', text: 'Experience the power of sacred sounds and vibrations', cta: 'Begin meditation', tone: 'saffron' },
  { icon: 'fas fa-wind', title: 'Pranayama', text: 'Master the art of breath control for mental clarity', cta: 'Begin practice', tone: 'sky' },
];

const TEACHERS = [
  { name: 'Adi Shankaracharya', deva: 'आदि शंकराचार्य', mono: 'शं', badge: 'Advaita Vedanta', text: '8th century philosopher who consolidated Advaita Vedanta', tags: ['Non-dualism', 'Self-Realization'] },
  { name: 'Swami Vivekananda', deva: 'स्वामी विवेकानन्द', mono: 'वि', badge: 'Modern Yoga', text: 'Introduced Yoga and Vedanta to the Western world', tags: ['Raja Yoga', 'Practical Vedanta'] },
];

const QUOTES = [
  { q: 'You are not the body, nor the mind, but the eternal consciousness.', c: 'Ashtavakra Gita' },
  { q: 'Yoga is the journey of the self, through the self, to the self.', c: 'Bhagavad Gita' },
  { q: 'The mind is everything. What you think, you become.', c: 'Gautama Buddha' },
  { q: 'See the Divine in every being, and serve the Divine in all.', c: 'Sri Ramakrishna' },
];

const JUMP = [
  { id: 'wisdom', label: 'Paths', icon: 'fas fa-route' },
  { id: 'teachings', label: 'Scriptures', icon: 'fas fa-scroll' },
  { id: 'meditation', label: 'Meditation', icon: 'fas fa-spa' },
  { id: 'teachers', label: 'Teachers', icon: 'fas fa-user-graduate' },
  { id: 'quotes', label: 'Quotes', icon: 'fas fa-quote-left' },
];

const tone = (t: Tone) => (t === 'saffron' ? '' : ` ${t}`);

/** The section currently under the sticky bars: the last one whose top has scrolled past them. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState('');
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // Header + section bar + a little slack (in-page jumps land at about 150px).
      const line = 180;
      let current = '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ids]);
  return active;
}

const JUMP_IDS = JUMP.map((j) => j.id);

/** Indian Spiritual Knowledge (ind_know.php). */
export default function IndianKnowledgePage() {
  useBodyClass('page-indian-knowledge');
  const active = useActiveSection(JUMP_IDS);
  const trackRef = useRef<HTMLDivElement>(null);

  // Phones: keep the active chip in view inside the scrollable bar (scrolls the bar only, not the page).
  useEffect(() => {
    const track = trackRef.current;
    const chip = track?.querySelector<HTMLElement>('.ik-jump-link.active');
    if (!track || !chip || track.scrollWidth <= track.clientWidth) return;
    const left = chip.offsetLeft - (track.clientWidth - chip.offsetWidth) / 2;
    track.scrollTo({ left, behavior: 'smooth' });
  }, [active]);

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
        <p className="ik-hero-verse mt-4 mb-0">
          <span className="deva">“योगस्थः कुरु कर्माणि”</span>
          <span className="ik-hero-verse-en">Perform your duty established in Yoga · Bhagavad Gita 2.48</span>
        </p>
      </PageHero>

      {/* On-page navigation: stays under the header while the page scrolls. */}
      <nav className="ik-jump" aria-label="On this page">
        <div className="container">
          <div className="ik-jump-track" ref={trackRef}>
            {JUMP.map((j) => (
              <a key={j.id} href={`#${j.id}`} className={`ik-jump-link${active === j.id ? ' active' : ''}`} aria-current={active === j.id ? 'true' : undefined}>
                <i className={j.icon}></i>
                {j.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <Section id="wisdom" deva="ज्ञानमार्गः" title="Paths of spiritual wisdom" lead="Discover the four traditional paths to spiritual enlightenment.">
        <div className="row g-3 g-md-4">
          {PATHS.map((p, i) => (
            <div className="col-6 col-lg-3" key={p.title}>
              <article className="ik-path card-soft hover reveal">
                <div className="ik-path-top">
                  <span className={`icon-badge mb-0${tone(p.tone)}`}>
                    <i className={p.icon}></i>
                  </span>
                  <span className="ik-path-num">0{i + 1}</span>
                </div>
                <h3 className="h4 mb-1">{p.title}</h3>
                <div className="ik-path-deva deva">{p.deva}</div>
                <p className="text-muted mb-0">{p.text}</p>
              </article>
            </div>
          ))}
        </div>
      </Section>

      <Section id="teachings" tone="alt" deva="पवित्र ग्रन्थाः" title="Sacred scriptures" lead="Explore the eternal wisdom of India's spiritual literature.">
        <div className="row g-3 g-md-4">
          {SCRIPTURES.map((s) => (
            <div className="col-12 col-sm-6 col-lg-3" key={s.title}>
              <article className="ik-scripture card-soft hover reveal">
                <div className={`ik-cover${tone(s.tone)}`} aria-hidden="true">
                  <span className="ik-cover-tag">{s.tag}</span>
                  <span className="ik-cover-deva deva">{s.deva}</span>
                  <span className="ik-cover-om deva">ॐ</span>
                </div>
                <div className="ik-scripture-body">
                  <h3 className="h4 mb-1">{s.title}</h3>
                  <div className="ik-facts">{s.facts}</div>
                  <p className="text-muted small">{s.text}</p>
                  <Link to="/spirituality/library" className="btn btn-outline-primary btn-sm mt-auto align-self-start">
                    Study now <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      </Section>

      <Section id="meditation" deva="ध्यान मार्गः" title="Meditation & inner peace" lead="Learn ancient meditation techniques for modern life.">
        <div className="row g-3 g-md-4 justify-content-center">
          {MEDITATION.map((m) => (
            <div className="col-md-4" key={m.title}>
              <article className="ik-practice card-soft hover reveal">
                <span className={`icon-badge${tone(m.tone)}`}>
                  <i className={m.icon}></i>
                </span>
                <div className="ik-practice-body">
                  <h3 className="h4">{m.title}</h3>
                  <p className="text-muted">{m.text}</p>
                  <Link to="/courses" className="ik-practice-cta">
                    {m.cta} <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      </Section>

      <Section id="teachers" tone="alt" deva="आचार्याः" title="Eminent spiritual teachers" lead="Learn from the masters who preserved and propagated spiritual wisdom.">
        <div className="row g-3 g-md-4">
          {TEACHERS.map((t) => (
            <div className="col-md-6" key={t.name}>
              <article className="ik-teacher card-soft reveal">
                <span className="ik-teacher-mono deva" aria-hidden="true">
                  {t.mono}
                </span>
                <div className="min-w-0">
                  <span className="chip indigo mb-2">{t.badge}</span>
                  <h3 className="h4 mb-0">{t.name}</h3>
                  <div className="ik-teacher-deva deva">{t.deva}</div>
                  <p className="text-muted">{t.text}</p>
                  <div className="d-flex gap-2 flex-wrap">
                    {t.tags.map((tag) => (
                      <span className="chip muted" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </Section>

      <Section id="quotes" deva="वचनामृतम्" title="Eternal wisdom quotes" lead="Timeless teachings from Indian spiritual masters.">
        {/* Phones: a swipeable row; tablets and up: a 2 × 2 grid. */}
        <div className="ik-quotes" role="list">
          {QUOTES.map((q) => (
            <figure className="card-soft quote-card ik-quote m-0" role="listitem" key={q.c}>
              <blockquote>“{q.q}”</blockquote>
              <cite>— {q.c}</cite>
            </figure>
          ))}
        </div>
        <p className="ik-swipe-hint d-md-none">
          <i className="fas fa-hand-point-right me-1"></i> Swipe for more
        </p>
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
