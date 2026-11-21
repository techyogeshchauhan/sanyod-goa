import { Link } from 'react-router-dom';
import { CtaBand, FeatureCard, FitImage, PageHero, Section, StatRow, type Tone } from '@/components/ui';

const STOCK = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

const CATEGORIES: { icon: string; title: string; text: string; tone: Tone }[] = [
  { icon: 'fas fa-om', title: 'Vedas & Upanishads', text: 'The foundational scriptures of Sanatana Dharma', tone: 'saffron' },
  { icon: 'fas fa-book', title: 'Puranas & Itihasas', text: 'Ancient histories and mythological texts', tone: 'indigo' },
  { icon: 'fas fa-yin-yang', title: 'Yoga & Meditation', text: 'Texts on spiritual practices and disciplines', tone: 'sage' },
  { icon: 'fas fa-leaf', title: 'Ayurveda & Healing', text: 'Ancient wisdom on health and wellbeing', tone: 'gold' },
  { icon: 'fas fa-dharmachakra', title: 'Buddhist Texts', text: 'Sutras, commentaries, and meditation guides', tone: 'sky' },
  { icon: 'fas fa-cross', title: 'Comparative Religion', text: 'Sacred texts from world religions', tone: 'rose' },
  { icon: 'fas fa-microphone-alt', title: 'Discourses & Lectures', text: 'Modern interpretations by spiritual masters', tone: 'indigo' },
  { icon: 'fas fa-language', title: 'Sanskrit Studies', text: 'Grammar, dictionaries, and learning resources', tone: 'saffron' },
];

const FEATURED = [
  { tag: 'Most Read', title: 'Bhagavad Gita', text: 'The celestial song containing the essence of Vedic wisdom. 700 verses of dialogue.', era: '500 BCE' },
  { tag: 'Yoga Text', title: 'Yoga Sutras of Patanjali', text: '196 aphorisms outlining the philosophy and practice of classical yoga.', era: '400 CE' },
  { tag: 'Philosophy', title: 'Principal Upanishads', text: '13 major Upanishads containing the philosophical essence of the Vedas.', era: '800-200 BCE' },
];

const MANUSCRIPTS = [
  {
    age: '~1500 BCE',
    title: 'Rigveda Samhita',
    text: 'The oldest extant Indo-European text. Contains 1,028 hymns (sūktas) in about 10,600 verses, organized into ten books (maṇḍalas).',
    icon: 'fas fa-scroll',
    note: 'Original Sanskrit with translations',
  },
  {
    age: '~500 BCE',
    title: 'Charaka Samhita',
    text: 'Ancient Sanskrit text on Ayurveda (Indian traditional medicine). Along with Sushruta Samhita, it is one of the two foundational texts of this field.',
    icon: 'fas fa-heart',
    note: 'Ayurvedic medicine text',
  },
  {
    age: '~300 BCE',
    title: 'Arthashastra',
    text: 'Ancient Indian Sanskrit treatise on statecraft, economic policy and military strategy. Authored by Kautilya, also known as Chanakya.',
    icon: 'fas fa-landmark',
    note: 'Political science text',
  },
];

const DIGITAL: { icon: string; title: string; text: string; cta: string; to: string; tone: Tone }[] = [
  { icon: 'fas fa-book-reader', title: 'Read Online', text: 'Access complete texts with beautiful typography and easy navigation', cta: 'Start reading', to: '/books', tone: 'indigo' },
  { icon: 'fas fa-headphones', title: 'Audio Scriptures', text: 'Listen to sacred texts narrated by traditional scholars', cta: 'Listen now', to: '/courses', tone: 'saffron' },
  { icon: 'fas fa-download', title: 'Download Texts', text: 'Download PDFs and eBooks for offline study', cta: 'Download', to: '/books', tone: 'sage' },
];

const RESOURCES = [
  { tag: 'Dictionary', title: 'Sanskrit-English Dictionary', text: 'Comprehensive dictionary with 50,000+ words and meanings' },
  { tag: 'Commentary', title: 'Bhagavad Gita Commentaries', text: '50+ traditional and modern commentaries' },
  { tag: 'Course', title: 'Scripture Study Courses', text: 'Structured learning paths for major texts' },
  { tag: 'Research', title: 'Academic Papers', text: '5000+ research papers on Indian philosophy' },
];

const STATS = [
  { value: '10K+', label: 'Digital texts' },
  { value: '50+', label: 'Languages' },
  { value: '100K+', label: 'Monthly readers' },
  { value: '5000+', label: 'Years of wisdom' },
];

/** Spiritual Library (lab.php). */
export default function SpiritualLibraryPage() {
  return (
    <>
      <PageHero
        center
        crumbs={[{ label: 'Spirituality' }, { label: 'Spiritual Library' }]}
        deva="विद्याधनं सर्वधनप्रधानम्"
        title="Spiritual Library"
        lead="Explore the world's largest digital collection of ancient scriptures, spiritual texts, and wisdom literature. Journey through millennia of spiritual knowledge preserved for modern seekers."
        actions={
          <>
            <a href="#explore" className="btn btn-primary btn-lg">
              <i className="fas fa-book-open"></i> Explore library
            </a>
            <a href="#search" className="btn btn-light btn-lg">
              <i className="fas fa-search text-saffron"></i> Search texts
            </a>
          </>
        }
      >
        <div className="stat-row mt-5 mx-auto" style={{ maxWidth: 560 }}>
          {[
            ['10,000+', 'Ancient texts'],
            ['5,000+', 'Years of wisdom'],
            ['50+', 'Languages'],
          ].map(([v, l]) => (
            <div className="stat py-0" key={l}>
              <div className="value">{v}</div>
              <div className="label">{l}</div>
            </div>
          ))}
        </div>
      </PageHero>

      <Section id="explore" deva="ज्ञान विभागाः" title="Sacred categories" lead="Browse our extensive collection of spiritual texts by category.">
        <div className="row g-4">
          {CATEGORIES.map((c) => (
            <div className="col-sm-6 col-lg-3" key={c.title}>
              <FeatureCard icon={c.icon} title={c.title} text={c.text} tone={c.tone}>
                <Link to="/books" className="fw-600 small text-saffron d-inline-block mt-2">
                  Explore <i className="fas fa-arrow-right ms-1"></i>
                </Link>
              </FeatureCard>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="alt" deva="प्रमुख ग्रन्थाः" title="Featured scriptures" lead="Explore our most treasured spiritual texts.">
        <div className="row g-4">
          {FEATURED.map((f) => (
            <div className="col-md-6 col-lg-4" key={f.title}>
              <article className="card-soft card-media hover reveal">
                <div className="media">
                  <span className="media-tag chip solid">{f.tag}</span>
                  <FitImage src={STOCK} loading="lazy" />
                </div>
                <div className="body">
                  <h3 className="h4">{f.title}</h3>
                  <p className="text-muted small">{f.text}</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="small text-muted">
                      <i className="fas fa-clock text-saffron me-1"></i>
                      {f.era}
                    </span>
                    <Link to="/books" className="btn btn-primary btn-sm">
                      Read now
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </Section>

      <Section deva="प्राचीन पाण्डुलिपयः" title="Ancient manuscripts" lead="Digitally preserved manuscripts from ancient times.">
        <div className="container-narrow d-grid gap-3">
          {MANUSCRIPTS.map((m) => (
            <div className="card-soft reveal" key={m.title}>
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <h3 className="h4 mb-1">{m.title}</h3>
                <span className="chip gold">{m.age}</span>
              </div>
              <p className="text-muted">{m.text}</p>
              <span className="small text-muted">
                <i className={`${m.icon} text-saffron me-2`}></i>
                {m.note}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="alt" deva="आभासी पुस्तकालयः" title="Digital access" lead="Access our spiritual library from anywhere in the world.">
        <div className="row g-4">
          {DIGITAL.map((d) => (
            <div className="col-md-4" key={d.title}>
              <FeatureCard icon={d.icon} title={d.title} text={d.text} tone={d.tone}>
                <Link to={d.to} className="btn btn-light btn-sm mt-3">
                  {d.cta}
                </Link>
              </FeatureCard>
            </div>
          ))}
        </div>
      </Section>

      <Section id="search" deva="अन्वेषण" title="Search our library" lead="Find specific texts, verses, or topics across our entire collection.">
        <form className="card-flat container-narrow reveal" onSubmit={(e) => e.preventDefault()} role="search">
          <div className="input-group mb-3">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input className="form-control" placeholder="Search for a scripture, verse or topic" aria-label="Search the library" />
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Category</label>
              <select className="form-select" defaultValue="">
                <option value="">All categories</option>
                {['Vedas', 'Upanishads', 'Puranas', 'Yoga Texts', 'Ayurveda', 'Philosophy'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Language</label>
              <select className="form-select" defaultValue="">
                <option value="">All languages</option>
                {['Sanskrit', 'Hindi', 'English', 'Tamil', 'Bengali', 'Multiple Languages'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-center flex-wrap mt-4">
            <Link to="/books" className="btn btn-light">
              <i className="fas fa-random text-saffron"></i> Random scripture
            </Link>
            <Link to="/books" className="btn btn-primary">
              <i className="fas fa-star"></i> Featured today
            </Link>
          </div>
        </form>
      </Section>

      <Section tone="alt" deva="अध्ययन साधनानि" title="Study resources" lead="Tools and resources to deepen your understanding.">
        <div className="row g-4">
          {RESOURCES.map((r) => (
            <div className="col-sm-6 col-lg-3" key={r.title}>
              <div className="card-soft hover reveal d-flex flex-column">
                <span className="chip indigo align-self-start mb-3">{r.tag}</span>
                <h3 className="h4">{r.title}</h3>
                <p className="text-muted small">{r.text}</p>
                <Link to="/courses" className="btn btn-light btn-sm mt-auto align-self-start">
                  Access
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="ink" size="sm">
        <StatRow items={STATS} />
      </Section>

      <section className="section">
        <div className="container">
          <CtaBand
            deva="पुस्तकस्था तु या विद्या परहस्तगतं धनम्"
            title="Start your spiritual reading journey"
            lead="Join thousands of spiritual seekers who study and contemplate ancient wisdom daily. Access is completely free for all sincere students."
            actions={
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  <i className="fas fa-user-plus"></i> Create free account
                </Link>
                <Link to="/books" className="btn btn-outline-light btn-lg">
                  <i className="fas fa-bookmark"></i> Browse books
                </Link>
              </>
            }
          >
            <div className="stat-row mt-4 mx-auto" style={{ maxWidth: 520 }}>
              {[
                ['100%', 'Free access'],
                ['24/7', 'Available'],
                ['No Ads', 'Distraction-free'],
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
    </>
  );
}
