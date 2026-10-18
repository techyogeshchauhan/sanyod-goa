import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { newsletterSchema } from '@shared/schemas/forms';
import { formsApi } from '@/api/forms';
import { SITE } from '@/config/site';

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/programs', label: 'Programe' },
  { to: '/personality-test', label: 'Personality Test' },
  { to: '/books', label: 'Books' },
  { to: '/courses', label: 'Courses' },
  // Live label "Sprituality" pointed to courses.php; now links to the spirituality section (A3).
  { to: '/spirituality/indian-knowledge', label: 'Sprituality' },
  { to: '/health', label: 'Health' },
  { to: '/about', label: 'About' },
] as const;

// Live: jQuery staggers `.footer-item a, .contact-info a` by 0.1s in document order.
const delay = (index: number): CSSProperties => ({ animationDelay: `${index * 0.1}s` });

type SubscribeState = 'idle' | 'loading' | 'done';

/** Footer (footer.php "Footer Start"). */
export function Footer() {
  const [subscribe, setSubscribe] = useState<SubscribeState>('idle');
  const [email, setEmail] = useState('');
  let linkIndex = 0;
  const next = () => delay(linkIndex++);

  /** Same feedback as live (spinner → "Subscribed!"), but the email is now saved (A2). */
  async function handleSubscribe() {
    const parsed = newsletterSchema.safeParse({ email });
    if (!parsed.success) {
      window.alert('Please enter a valid email address');
      return;
    }
    setSubscribe('loading');
    try {
      await formsApi.newsletter(parsed.data);
      setSubscribe('done');
    } catch {
      setSubscribe('idle');
      window.alert('Subscription failed. Please try again later.');
    }
  }

  return (
    <>
      <div className="container-fluid footer py-5">
        <div className="footer-decoration decoration-1">
          <i className="fas fa-om"></i>
        </div>
        <div className="footer-decoration decoration-2">
          <i className="fas fa-lotus"></i>
        </div>

        <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
          <div className="row g-5">
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column">
                <div className="footer-item">
                  <h4 className="text-white mb-4">
                    <b>San -sankhya (सांख्य), Yo - Yog (योग), d- darshan (दर्शन)</b>
                  </h4>
                  <p className="mb-3 text-white">
                    साधक <span className="name-highlight">जामवंत</span>, सांख्य योग दर्शन के गहन अध्येता और जीवन के समग्र विकास के
                    लिए समर्पित एक मार्गदर्शक हैं। इनकी यात्रा सांख्य और योग के प्राचीन भारतीय दर्शन से शुरू हुई, जो जीवन को{' '}
                    <span className="highlight-text">वैज्ञानिक, आध्यात्मिक, शारीरिक और मानसिक स्वास्थ्य</span> के दृष्टिकोण से
                    समझने का एक अनूठा मार्ग प्रदान करते हैं।
                  </p>
                </div>
                <div className="position-relative mt-3">
                  <input
                    className="form-control rounded-pill w-100 py-3 ps-4 pe-5"
                    type="text"
                    placeholder="Enter your email"
                    aria-label="Email for newsletter"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSubscribe();
                    }}
                  />
                  <button
                    type="button"
                    className={`btn btn-secondary rounded-pill position-absolute top-0 end-0 py-2 mt-2 me-2${subscribe === 'done' ? ' bg-success' : ''}`}
                    onClick={handleSubscribe}
                    disabled={subscribe !== 'idle'}
                  >
                    {subscribe === 'loading' ? <i className="fas fa-spinner fa-spin"></i> : subscribe === 'done' ? 'Subscribed!' : 'Subscribe'}
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column text-white">
                <h4 className="text-white mb-4">Quick Links</h4>
                {QUICK_LINKS.map((link) => (
                  <Link key={link.label} to={link.to} style={next()}>
                    <i className="fas fa-angle-right me-2"></i>
                    {link.label}
                  </Link>
                ))}
                <Link to="/admin/login" target="_blank" style={next()}>
                  {' '}
                  <i className="fas fa-angle-right me-2"></i>Admin Login
                </Link>
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column working-hours">
                <h4 className="text-white mb-4">Still have questions</h4>
                {SITE.workingHours.map((h) => (
                  <div className="mb-3" key={h.label}>
                    <h6 className="mb-0">{h.label}</h6>
                    <p className="mb-0">{h.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item d-flex flex-column contact-info">
                <h4 className="text-white mb-4">Contact Info</h4>
                <a href="#" style={next()} onClick={(e) => e.preventDefault()}>
                  <i className="fa fa-map-marker-alt me-2"></i> {SITE.location}
                </a>
                <a href={`mailto:${SITE.email}`} style={next()}>
                  <i className="fas fa-envelope me-2"></i>
                  {SITE.email}
                </a>
                <a href={`tel:${SITE.phone}`} style={next()}>
                  <i className="fas fa-phone me-2"></i>
                  {SITE.phone}
                </a>
                <a href={`tel:${SITE.phone}`} className="mb-3" style={next()}>
                  <i className="fas fa-print me-2"></i>
                  {SITE.phone}
                </a>
                <div className="d-flex mt-2">
                  <a className="btn btn-secondary btn-md-square rounded-circle me-3" href={SITE.social.facebook} style={next()} aria-label="Facebook">
                    <i className="fab fa-facebook-f text-white"></i>
                  </a>
                  <a className="btn btn-secondary btn-md-square rounded-circle me-3" href={SITE.social.twitter} style={next()} aria-label="Twitter">
                    <i className="fab fa-twitter text-white"></i>
                  </a>
                  <a className="btn btn-secondary btn-md-square rounded-circle me-3" href={SITE.social.instagram} style={next()} aria-label="Instagram">
                    <i className="fab fa-instagram text-white"></i>
                  </a>
                  <a className="btn btn-secondary btn-md-square rounded-circle me-0" href={SITE.social.linkedin} style={next()} aria-label="LinkedIn">
                    <i className="fab fa-linkedin-in text-white"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid copyright py-4">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-6 text-center text-md-start mb-md-0">
              <span className="text-body">
                <a href="#" className="border-bottom text-white" onClick={(e) => e.preventDefault()}>
                  <i className="fas fa-copyright text-light me-2"></i>
                </a>
                Copyrights 2025 San-sankhya Yog Darshan All rights reserved.
              </span>
            </div>
            <div className="col-md-6 text-center text-md-end text-body">
              Designed By{' '}
              <a className="border-bottom text-white" href="#" onClick={(e) => e.preventDefault()}>
                {' '}
                Hawkswave, New Delhi
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
