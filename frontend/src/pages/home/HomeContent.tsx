// Home page (index.php content, redesigned). Texts are the live page's; layout is the SANYOD design system.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { HomeCourses } from '@shared/types/course';
import { YouTubeFacade } from '@/components/common/YouTubeFacade';
import { CourseCard } from '@/components/courses/CourseCard';
import { FeatureCard, Section, StatRow, type Tone } from '@/components/ui';
import { optimizedSrc } from '@/utils/images';

const WHY: { icon: string; title: string; text: string; tone: Tone }[] = [
  { icon: 'fas fa-video', title: 'Recorded Sessions', text: 'Learn at your pace with vibrant video classes', tone: 'saffron' },
  { icon: 'fas fa-rupee-sign', title: 'Affordable', text: 'Quality education that fits every budget', tone: 'gold' },
  { icon: 'fas fa-book', title: 'Authentic Courses', text: 'Traditional knowledge taught authentically', tone: 'sage' },
  { icon: 'fab fa-whatsapp', title: 'Community', text: 'Active WhatsApp groups for support', tone: 'sky' },
  { icon: 'fas fa-clock', title: '1 Year Access', text: 'Learn anytime for a full year', tone: 'rose' },
  { icon: 'fas fa-file-alt', title: 'Notes & Quizzes', text: 'Comprehensive study materials', tone: 'indigo' },
  { icon: 'fas fa-certificate', title: 'Certification', text: 'Get certified upon completion', tone: 'saffron' },
  { icon: 'fas fa-comments', title: 'Live Q&A', text: 'Interactive sessions with experts', tone: 'sage' },
];

const STATS = [
  { value: '829K+', label: 'Enrolled students' },
  { value: '56K+', label: 'App downloads' },
  { value: '40+ hrs', label: 'Content uploaded' },
  { value: '4.9/5', label: 'Average rating' },
];

const QUICK: { to: string; icon: string; title: string; text: string; cta: string; tone: Tone }[] = [
  { to: '/programs', icon: 'fas fa-chalkboard-teacher', title: 'Programmes', text: 'Specialized learning programs and courses', cta: 'View details', tone: 'indigo' },
  { to: '/personality-test', icon: 'fas fa-brain', title: 'Personality Test', text: 'Discover your personality type and traits', cta: 'Take the test', tone: 'rose' },
  { to: '/books', icon: 'fas fa-book', title: 'Books', text: 'Spiritual and educational books collection', cta: 'Explore books', tone: 'gold' },
  { to: '/courses', icon: 'fas fa-graduation-cap', title: 'Courses', text: 'Comprehensive learning courses', cta: 'Browse courses', tone: 'saffron' },
  { to: '/spirituality/indian-knowledge', icon: 'fas fa-spa', title: 'Spirituality', text: 'Spiritual guidance and practices', cta: 'Explore spirituality', tone: 'sage' },
  { to: '/health', icon: 'fas fa-heart', title: 'Health', text: 'Support our spiritual mission', cta: 'View details', tone: 'rose' },
  { to: '/contact', icon: 'fas fa-phone-alt', title: 'Contact', text: 'Get in touch with us', cta: 'Contact us', tone: 'sky' },
];

const STUDY = [
  { n: '01', title: 'Understand Rituals Deeply', text: 'Explanations help grasp profound reasons behind Hindu rituals and traditions.' },
  { n: '02', title: 'Decode Mythology', text: 'Vibrant illustrations uncover hidden meanings in ancient stories.' },
  { n: '03', title: 'Identify Misinterpretations', text: 'Learning helps recognize distorted interpretations easily.' },
  { n: '04', title: 'Practical Application', text: 'Examples show how to apply wisdom in daily life.' },
];

const MASTERCLASSES = [
  { icon: 'fas fa-language', title: 'संस्कृत परिचय', text: 'Introduction to Sanskrit language' },
  { icon: 'fas fa-book-open', title: 'गीता प्रथम अध्याय', text: 'Vibrant discussion of Bhagavad Gita' },
  { icon: 'fas fa-spa', title: 'योग सूत्र संवाद', text: 'Exploration of Yoga Sutras' },
];

const SEEKERS = ['Housewives', 'Students', 'Professionals', 'Seekers'];
const COUNTRIES = ['American', 'Nepali', 'UAE', 'English', 'Australian'];

/** One word at a time, cross-fading (replaces the live typing effect). */
function RotatingWord({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);
  return (
    <span className="accent" key={i} style={{ display: 'inline-block', animation: 'rw-in .5s ease' }}>
      {words[i]}
    </span>
  );
}

export default function HomeContent({ courses, loggedIn }: { courses?: HomeCourses; loggedIn: boolean }) {
  return (
    <>
      {/* Hero */}
      <section className="home-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-md-7">
              <div className="eyebrow-deva">सांख्य · योग · दर्शन</div>
              <h1 className="display-title">
                Learn Sanskrit &amp; Indian Wisdom <span className="accent">online, in Hindi</span>
              </h1>
              <p className="lead mt-3">
                Master ancient knowledge through expert-led video classes. Join 1 Lakh+ satisfied learners on their spiritual journey.
              </p>
              <div className="hero-actions">
                <Link to="/courses" className="btn btn-primary btn-lg">
                  <i className="fas fa-search"></i> Find your course
                </Link>
                <a href="#introduction" className="btn btn-light btn-lg">
                  <i className="fas fa-play-circle text-saffron"></i> Watch introduction
                </a>
              </div>
              <p className="text-muted small mt-4 mb-0">
                <i className="fas fa-users me-2 text-saffron"></i>
                Thousands of <RotatingWord words={SEEKERS} /> have chosen wisdom.
              </p>
            </div>
            <div className="col-md-5">
              <div className="hero-visual">
                <img src={optimizedSrc('/images/SanYod.jpg')} alt="Sadhaka Jamwant, founder of SANYOD" width={853} height={1280} fetchPriority="high" />
                <div className="hero-float card-soft">
                  <span className="icon-badge sage mb-0">
                    <i className="fas fa-star"></i>
                  </span>
                  <div>
                    <div className="fw-600 text-ink">4.9 / 5 rating</div>
                    <div className="small text-muted">from our learners</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-sm section-white border-bottom" style={{ borderColor: 'var(--line)' }}>
        <div className="container">
          <StatRow items={STATS} />
        </div>
      </section>

      {/* Introduction video */}
      <Section id="introduction" eyebrow="Introduction" title="Experience wisdom in colour" lead="Watch our introduction to understand the depth and beauty of Sanskrit learning.">
        <div className="row justify-content-center">
          <div className="col-lg-10 reveal">
            <div className="ratio ratio-16x9 rounded-xl overflow-hidden shadow-soft">
              <YouTubeFacade id="ey3lX6OpVps" title="SANYOD introduction" />
            </div>
            <div className="text-center mt-4">
              <Link to="/courses" className="btn btn-ink">
                <i className="fas fa-gem"></i> Start your journey
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* Why SANYOD */}
      <Section tone="alt" eyebrow="Why SANYOD" title="Everything you need to learn with joy" lead="Discover the advantages of learning with us.">
        <div className="row g-3 g-sm-4 grid-compact">
          {WHY.map((f) => (
            <div className="col-6 col-lg-3" key={f.title}>
              <FeatureCard icon={f.icon} title={f.title} text={f.text} tone={f.tone} />
            </div>
          ))}
        </div>
      </Section>

      {/* Courses from the API */}
      <Section eyebrow="Courses" title="Explore our courses" lead="Thoughtfully designed for every level, from first steps to deep study.">
        {courses && courses.newArrivals.length > 0 && (
          <>
            <h3 className="h4 mb-4 reveal">
              <i className="fas fa-seedling text-sage me-2"></i>New arrivals
            </h3>
            <div className="row g-4 mb-4">
              {courses.newArrivals.map((c) => (
                <div className="col-md-6 col-lg-4" key={c.id}>
                  <CourseCard course={c} tag={<span className="chip solid">NEW</span>}>
                    <Link to={`/courses/${c.slug}`} className="btn btn-primary btn-sm">
                      Enroll now
                    </Link>
                  </CourseCard>
                </div>
              ))}
            </div>
          </>
        )}
        {courses && courses.popular.length > 0 && (
          <>
            <h3 className="h4 mb-4 reveal">
              <i className="fas fa-fire text-saffron me-2"></i>Most popular
            </h3>
            <div className="row g-4">
              {courses.popular.map((c) => (
                <div className="col-md-6 col-lg-4" key={c.id}>
                  <CourseCard course={c} tag={<span className="chip">POPULAR</span>}>
                    <Link to={`/courses/${c.slug}`} className="btn btn-primary btn-sm">
                      Enroll now
                    </Link>
                  </CourseCard>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="text-center mt-4">
          <Link to={loggedIn ? '/courses' : '/login'} className="btn btn-outline-primary">
            {loggedIn ? 'View all courses' : 'Log in to view all courses'} <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </Section>

      {/* Quick access */}
      <Section tone="alt" eyebrow="Quick access" title="Where would you like to go?" lead="Direct access to all our important sections.">
        <div className="row g-3 g-sm-4 justify-content-center grid-compact">
          {QUICK.map((q) => (
            <div className="col-6 col-lg-3" key={q.to}>
              <Link to={q.to} className="card-soft hover reveal text-decoration-none">
                <span className={`icon-badge ${q.tone === 'saffron' ? '' : q.tone}`}>
                  <i className={q.icon}></i>
                </span>
                <h3 className="h4">{q.title}</h3>
                <p className="text-muted small">{q.text}</p>
                <span className="fw-600 text-saffron small">
                  {q.cta} <i className="fas fa-arrow-right ms-1"></i>
                </span>
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Why study */}
      <Section eyebrow="Why study in SANYOD" title="Learning that makes ancient wisdom come alive">
        <div className="row g-4">
          {STUDY.map((s) => (
            <div className="col-md-6" key={s.n}>
              <div className="card-soft reveal d-flex gap-3">
                <span className="step-num">{s.n}</span>
                <div>
                  <h3 className="h4">{s.title}</h3>
                  <p className="text-muted mb-0">{s.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Free masterclasses */}
      <Section tone="alt" eyebrow="Free masterclasses" title="Experience our teaching for free">
        <div className="row g-4 justify-content-center">
          {MASTERCLASSES.map((m) => (
            <div className="col-md-4" key={m.title}>
              <div className="card-soft hover reveal text-center">
                <span className="chip sage mb-3">FREE</span>
                <div>
                  <span className="icon-badge lg">
                    <i className={m.icon}></i>
                  </span>
                </div>
                <h3 className="h4 deva">{m.title}</h3>
                <p className="text-muted">{m.text}</p>
                <Link to="/courses" className="btn btn-outline-primary btn-sm">
                  Join free class
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Video + closing line */}
      <Section>
        <div className="row justify-content-center">
          <div className="col-lg-10 reveal">
            <div className="ratio ratio-16x9 rounded-xl overflow-hidden shadow-soft bg-dark">
              <video controls preload="metadata">
                <source src="/images/videos/video.mp4" type="video/mp4" />
              </video>
            </div>
            <p className="text-center h3 mt-4 mb-0">
              <RotatingWord words={COUNTRIES} interval={2000} /> students learn with SANYOD.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
