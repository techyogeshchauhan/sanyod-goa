import { Link } from 'react-router-dom';
import { Avatar, CtaBand, FeatureCard, FitImage, PageHero, QuoteCard, Section, type Tone } from '@/components/ui';

const STOCK = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

const WHY: { icon: string; title: string; text: string; tone: Tone }[] = [
  { icon: 'fas fa-hands', title: 'Collective Energy', text: 'Experience amplified spiritual energy through group meditation and prayer', tone: 'saffron' },
  { icon: 'fas fa-book-reader', title: 'Wisdom Sharing', text: 'Learn from experienced practitioners and share your spiritual insights', tone: 'indigo' },
  { icon: 'fas fa-heart', title: 'Emotional Support', text: 'Find compassion and understanding in a supportive spiritual family', tone: 'rose' },
  { icon: 'fas fa-globe-asia', title: 'Global Network', text: 'Connect with spiritual seekers from around the world', tone: 'sage' },
];

const SCHEDULE = [
  {
    time: 'Today, 7:00 PM IST',
    badge: 'Live',
    tone: 'rose',
    title: 'Daily Evening Bhajan & Meditation',
    text: 'Join our daily spiritual gathering for soulful bhajans followed by guided meditation and discourse on Bhagavad Gita.',
    host: 'Hosted by: Swami Devanand',
    cta: 'Join now',
  },
  {
    time: 'Tomorrow, 6:00 AM IST',
    badge: 'Morning',
    tone: 'gold',
    title: 'Sunrise Meditation & Pranayama',
    text: 'Start your day with collective sunrise meditation, pranayama, and chanting of Gayatri Mantra.',
    host: 'Hosted by: Yoga Acharya Priya',
    cta: 'Set reminder',
  },
  {
    time: 'Sunday, 10:00 AM IST',
    badge: 'Special',
    tone: 'indigo',
    title: 'Weekly Maha Satsang',
    text: 'Special weekly gathering with extended kirtan, discourse by senior teachers, and community sharing.',
    host: 'Multiple Spiritual Teachers',
    cta: 'Register',
  },
];

const MEMBERS = [
  { name: 'Rajesh Kumar', role: 'Meditation Guide', text: 'Practicing Vipassana for 15 years' },
  { name: 'Priya Sharma', role: 'Bhajan Singer', text: 'Classical vocalist & spiritual singer' },
  { name: 'Amit Patel', role: 'Yoga Teacher', text: 'Certified Hatha & Kundalini Yoga teacher' },
];

const MUSIC: { icon: string; title: string; text: string; cta: string; tone: Tone }[] = [
  { icon: 'fas fa-music', title: 'Live Bhajan Sessions', text: 'Join daily live bhajan sessions with traditional Indian instruments', cta: 'Join bhajan', tone: 'saffron' },
  { icon: 'fas fa-om', title: 'Mantra Chanting', text: 'Collective chanting of powerful mantras for spiritual purification', cta: 'Chant with us', tone: 'indigo' },
  { icon: 'fas fa-drum', title: 'Kirtan Circles', text: 'Participate in energetic kirtan circles with harmonium and tabla', cta: 'Join kirtan', tone: 'sage' },
];

const FORUMS = [
  { title: 'Bhagavad Gita Study Group', text: 'Weekly study and discussion of Bhagavad Gita verses with practical applications in modern life.', stats: ['245 Discussions', '1.2K Members', 'Active Now'] },
  { title: 'Meditation Experiences Sharing', text: "Share your meditation experiences and learn from others' spiritual journeys.", stats: ['189 Discussions', '890 Members', 'Very Active'] },
  { title: 'Q&A with Spiritual Teachers', text: 'Get your spiritual questions answered by experienced teachers and practitioners.', stats: ['567 Questions', '2.5K Members', 'Active Now'] },
];

const VIRTUAL = [
  { tag: 'Live Streaming', title: 'Global Live Satsang', text: 'Join our live virtual satsang with participants from 50+ countries simultaneously.', cta: 'Join live' },
  { tag: 'Recorded', title: 'Recorded Satsang Library', text: 'Access our extensive library of recorded satsangs, discourses, and bhajans.', cta: 'Browse library' },
];

const TESTIMONIALS = [
  { q: 'This community transformed my spiritual practice. The collective energy during bhajans is divine!', c: 'Meera Sharma, Mumbai', stars: 5 },
  { q: 'The morning meditation sessions with the community have brought immense peace to my life.', c: 'Rajat Verma, Delhi', stars: 4.5 },
  { q: 'As someone living abroad, virtual satsang keeps me connected to my spiritual roots.', c: 'Priya Patel, USA', stars: 5 },
  { q: 'The discussion forums have answered so many of my spiritual questions. Grateful for this sangha.', c: 'Amit Kumar, Bangalore', stars: 5 },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="text-warning small" aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i + 1 <= n ? 'fas fa-star' : i < n ? 'fas fa-star-half-alt' : 'far fa-star'}></i>
      ))}
    </div>
  );
}

/** Community & Satsang (counity.php). */
export default function CommunityPage() {
  return (
    <>
      <PageHero
        center
        crumbs={[{ label: 'Spirituality' }, { label: 'Community & Satsang' }]}
        deva="सत्संग कीर्तन"
        title="Community & Satsang"
        lead="Join our vibrant community of spiritual seekers. Experience the transformative power of collective meditation, bhajans, and divine discourse in the sacred company of truth-seekers."
        actions={
          <>
            <a href="#join" className="btn btn-primary btn-lg">
              <i className="fas fa-users"></i> Join community
            </a>
            <a href="#schedule" className="btn btn-light btn-lg">
              <i className="fas fa-calendar-alt text-saffron"></i> View schedule
            </a>
          </>
        }
      >
        <div className="stat-row mt-4 mx-auto" style={{ maxWidth: 560 }}>
          {[
            ['5,000+', 'Community members'],
            ['100+', 'Weekly satsangs'],
            ['50+', 'Countries'],
          ].map(([v, l]) => (
            <div className="stat py-0" key={l}>
              <div className="value">{v}</div>
              <div className="label">{l}</div>
            </div>
          ))}
        </div>
      </PageHero>

      <Section deva="सामुदायिक लाभ" title="Why join our spiritual community?" lead="Experience the collective energy of spiritual seekers on the same path.">
        <div className="row g-3 g-md-4 grid-compact">
          {WHY.map((w) => (
            <div className="col-6 col-lg-3" key={w.title}>
              <FeatureCard icon={w.icon} title={w.title} text={w.text} tone={w.tone} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="schedule" tone="alt" deva="सत्संग कार्यक्रम" title="Upcoming satsang events" lead="Join our live spiritual gatherings and experience divine communion.">
        <div className="container-narrow d-grid gap-3">
          {SCHEDULE.map((s) => (
            <div className="card-soft reveal" key={s.title}>
              <div className="d-flex gap-2 align-items-center flex-wrap mb-2">
                <span className="small fw-600 text-saffron">
                  <i className="far fa-clock me-1"></i>
                  {s.time}
                </span>
                <span className={`chip ${s.tone}`}>{s.badge}</span>
              </div>
              <h3 className="h4">{s.title}</h3>
              <p className="text-muted">{s.text}</p>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span className="small text-muted">
                  <i className="fas fa-user-circle me-1"></i>
                  {s.host}
                </span>
                <Link to="/programs" className="btn btn-primary btn-sm">
                  {s.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <Link to="/programs" className="btn btn-ink">
            <i className="fas fa-calendar"></i> View full calendar
          </Link>
        </div>
      </Section>

      <Section deva="साधक समुदाय" title="Meet our community members" lead="Connect with spiritual seekers from diverse backgrounds and traditions.">
        <div className="row g-4">
          {MEMBERS.map((m) => (
            <div className="col-md-4" key={m.name}>
              <div className="card-soft hover reveal text-center">
                <Avatar name={m.name} size="lg" />
                <span className="chip d-inline-flex mt-3">{m.role}</span>
                <h3 className="h4 mt-2 mb-1">{m.name}</h3>
                <p className="text-muted small mb-0">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="alt" deva="भजन कीर्तन" title="Divine music & chanting" lead="Experience the ecstasy of devotional singing and sacred chanting.">
        <div className="row g-3 g-md-4 list-compact">
          {MUSIC.map((m) => (
            <div className="col-md-4" key={m.title}>
              <FeatureCard icon={m.icon} title={m.title} text={m.text} tone={m.tone}>
                <Link to="/programs" className="btn btn-light btn-sm mt-3">
                  {m.cta}
                </Link>
              </FeatureCard>
            </div>
          ))}
        </div>
      </Section>

      <Section deva="ज्ञान चर्चा" title="Spiritual discussion forums" lead="Engage in meaningful spiritual discussions and Q&A sessions.">
        <div className="container-narrow d-grid gap-3">
          {FORUMS.map((f) => (
            <div className="card-soft reveal" key={f.title}>
              <h3 className="h4">{f.title}</h3>
              <p className="text-muted">{f.text}</p>
              <ul className="meta-list">
                <li>
                  <i className="fas fa-comments"></i>
                  {f.stats[0]}
                </li>
                <li>
                  <i className="fas fa-users"></i>
                  {f.stats[1]}
                </li>
                <li>
                  <i className="fas fa-fire"></i>
                  {f.stats[2]}
                </li>
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="alt" deva="आभासी सत्संग" title="Virtual satsang experience" lead="Participate in spiritual gatherings from anywhere in the world.">
        <div className="row g-4">
          {VIRTUAL.map((v) => (
            <div className="col-md-6" key={v.title}>
              <article className="card-soft card-media hover reveal">
                <div className="media">
                  <span className="media-tag chip solid">{v.tag}</span>
                  <FitImage src={STOCK} loading="lazy" />
                </div>
                <div className="body">
                  <h3 className="h4">{v.title}</h3>
                  <p className="text-muted">{v.text}</p>
                  <Link to="/courses" className="btn btn-primary btn-sm mt-auto align-self-start">
                    {v.cta}
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      </Section>

      <Section deva="अनुभव कथन" title="Community testimonials" lead="Hear what our community members say about their satsang experience.">
        <div className="row g-4">
          {TESTIMONIALS.map((t) => (
            <div className="col-md-6" key={t.c}>
              <QuoteCard quote={`“${t.q}”`} cite={`— ${t.c}`}>
                <div className="mt-2">
                  <Stars n={t.stars} />
                </div>
              </QuoteCard>
            </div>
          ))}
        </div>
      </Section>

      <section className="section pt-0" id="join">
        <div className="container">
          <CtaBand
            deva="साधक भवन्तु सुखिनः"
            title="Join our divine community today"
            lead="Experience the joy of spiritual companionship. Grow together on the path of self-realization with like-minded seekers from around the world."
            actions={
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  <i className="fas fa-user-plus"></i> Free registration
                </Link>
                <Link to="/contact" className="btn btn-outline-light btn-lg">
                  <i className="fas fa-comment-alt"></i> Talk to us
                </Link>
              </>
            }
          >
            <div className="stat-row mt-4 mx-auto" style={{ maxWidth: 560 }}>
              {[
                ['24/7', 'Community support'],
                ['100%', 'Free access'],
                ['50+', 'Languages supported'],
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
