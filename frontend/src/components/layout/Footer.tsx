import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { newsletterSchema } from '@shared/schemas/forms';
import { formsApi } from '@/api/forms';
import { SITE } from '@/config/site';

const EXPLORE = [
  { to: '/courses', label: 'Courses' },
  { to: '/books', label: 'Books' },
  { to: '/programs', label: 'Programmes' },
  { to: '/health', label: 'Health Consultation' },
  { to: '/personality-test', label: 'Personality Test' },
] as const;

const SPIRITUALITY = [
  { to: '/spirituality/indian-knowledge', label: 'Indian Knowledge & Wisdom' },
  { to: '/spirituality/library', label: 'Spiritual Library' },
  { to: '/spirituality/community', label: 'Community & Satsang' },
  { to: '/spirituality/personal-guidance', label: 'Personal Guidance' },
  { to: '/about', label: 'About SANYOD' },
  { to: '/contact', label: 'Contact' },
] as const;

const SOCIAL = [
  { key: 'facebook', icon: 'fab fa-facebook-f', label: 'Facebook' },
  { key: 'twitter', icon: 'fab fa-twitter', label: 'Twitter' },
  { key: 'instagram', icon: 'fab fa-instagram', label: 'Instagram' },
  { key: 'linkedin', icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
] as const;

type SubscribeState = 'idle' | 'loading' | 'done' | 'error';

/** Site footer: about, links, contact details, newsletter. */
export function Footer() {
  const [state, setState] = useState<SubscribeState>('idle');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  // Social profiles are placeholders ("#") until the real links are provided (Q17).
  const social = SOCIAL.filter((s) => SITE.social[s.key] && SITE.social[s.key] !== '#');

  async function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    const parsed = newsletterSchema.safeParse({ email });
    if (!parsed.success) {
      setState('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setState('loading');
    try {
      await formsApi.newsletter(parsed.data);
      setState('done');
      setMessage('Thank you! You are subscribed.');
      setEmail('');
    } catch {
      setState('error');
      setMessage('Subscription failed. Please try again later.');
    }
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-4">
            <Link to="/" className="brand mb-3">
              <img src={SITE.logo} alt="" style={{ height: 44, background: '#fff', borderRadius: 12, padding: 4 }} />
              <span>
                <span className="brand-name text-white">{SITE.name}</span>
                <span className="brand-tagline" style={{ color: '#9a93a3' }}>
                  {SITE.tagline}
                </span>
              </span>
            </Link>
            <p className="footer-about mt-3 deva" lang="hi">
              San - sankhya (सांख्य), Yo - Yog (योग), d - darshan (दर्शन). साधक <strong>जामवंत</strong>, सांख्य योग दर्शन के गहन अध्येता और
              जीवन के समग्र विकास के लिए समर्पित एक मार्गदर्शक हैं। इनकी यात्रा सांख्य और योग के प्राचीन भारतीय दर्शन से शुरू हुई, जो जीवन को{' '}
              <strong>वैज्ञानिक, आध्यात्मिक, शारीरिक और मानसिक स्वास्थ्य</strong> के दृष्टिकोण से समझने का एक अनूठा मार्ग प्रदान करते हैं।
            </p>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <h4>Explore</h4>
            <ul className="footer-links">
              {EXPLORE.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <h4>Spirituality</h4>
            <ul className="footer-links">
              {SPIRITUALITY.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-md-4 col-lg-3">
            <h4>Get in touch</h4>
            <ul className="footer-links mb-4">
              <li>
                <i className="fas fa-map-marker-alt me-2 text-saffron"></i>
                {SITE.location}
              </li>
              <li>
                <a href={`mailto:${SITE.email}`}>
                  <i className="fas fa-envelope me-2 text-saffron"></i>
                  {SITE.email}
                </a>
              </li>
              <li>
                <a href={`tel:${SITE.phone}`}>
                  <i className="fas fa-phone me-2 text-saffron"></i>
                  {SITE.phone}
                </a>
              </li>
            </ul>
            <h4 className="mb-2">Opening hours</h4>
            <ul className="footer-links small" style={{ gap: '0.25rem' }}>
              {SITE.workingHours.map((h) => (
                <li key={h.label}>
                  <span className="text-white-50">{h.label.replace(':', '')}</span> · {h.value}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="row g-4 align-items-center mt-4">
          <div className="col-lg-6">
            <h4 className="mb-1">Stay in touch</h4>
            <p className="mb-0 small" style={{ color: '#9a93a3' }}>
              New courses, books and satsang dates, straight to your inbox.
            </p>
          </div>
          <div className="col-lg-6">
            <form className="newsletter" onSubmit={handleSubscribe} noValidate>
              <input
                type="email"
                aria-label="Email address"
                placeholder="Your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state !== 'loading') setState('idle');
                }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={state === 'loading'}>
                {state === 'loading' ? <i className="fas fa-spinner fa-spin"></i> : 'Subscribe'}
              </button>
            </form>
            {(state === 'done' || state === 'error') && (
              <div className={`small mt-2 ${state === 'done' ? 'text-success' : 'text-warning'}`} role="status">
                {message}
              </div>
            )}
          </div>
        </div>

        <div className="footer-bottom d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <span>© {new Date().getFullYear()} San-sankhya Yog Darshan. All rights reserved.</span>
          <div className="d-flex align-items-center gap-3">
            {social.length > 0 && (
              <div className="social d-flex gap-2">
                {social.map((s) => (
                  <a key={s.key} href={SITE.social[s.key]} target="_blank" rel="noopener" aria-label={s.label}>
                    <i className={s.icon}></i>
                  </a>
                ))}
              </div>
            )}
            <Link to="/admin/login">Admin</Link>
            <span>Designed by Hawkswave, New Delhi</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
