import { PageHero } from '@/components/ui';
import { SITE } from '@/config/site';
import { ContactForm } from './ContactForm';

// The PHP page still showed the template's placeholders ("123 Street New York", three fake
// branches); the real SANYOD details are shown instead (Q8 default).
const CARDS = [
  { icon: 'fas fa-map-marker-alt', title: 'Visit', text: SITE.location, href: undefined },
  { icon: 'fas fa-envelope', title: 'Email', text: SITE.email, href: `mailto:${SITE.email}` },
  { icon: 'fas fa-phone-alt', title: 'Call', text: SITE.phone, href: `tel:${SITE.phone}` },
] as const;

/** Contact (contact.php). */
export default function ContactPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: 'Contact' }]}
        eyebrow="Contact us"
        title="We'd love to hear from you"
        lead="Questions about a course, a book order, a retreat or personal guidance? Write to us and we will reply within one working day."
      />
      <section className="section">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-5">
              <div className="d-grid gap-3">
                {CARDS.map((c) => (
                  <div className="card-soft reveal d-flex gap-3 align-items-center" key={c.title}>
                    <span className="icon-badge mb-0">
                      <i className={c.icon}></i>
                    </span>
                    <div>
                      <div className="small text-muted">{c.title}</div>
                      {c.href ? (
                        <a href={c.href} className="fw-600 text-ink">
                          {c.text}
                        </a>
                      ) : (
                        <div className="fw-600 text-ink">{c.text}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="card-soft reveal">
                  <div className="d-flex gap-3 align-items-center mb-3">
                    <span className="icon-badge indigo mb-0">
                      <i className="fas fa-clock"></i>
                    </span>
                    <h3 className="h5 mb-0">Opening hours</h3>
                  </div>
                  <ul className="list-unstyled mb-0 small">
                    {SITE.workingHours.map((h) => (
                      <li key={h.label} className="d-flex justify-content-between py-1 border-bottom" style={{ borderColor: 'var(--line)' }}>
                        <span className="text-muted">{h.label.replace(':', '')}</span>
                        <span className="text-ink fw-600 text-end">{h.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="card-flat reveal">
                <h2 className="h3 mb-1">Send your message</h2>
                <p className="text-muted mb-4">All fields except phone and topic are required.</p>
                <ContactForm />
              </div>
            </div>
          </div>
          <div className="mt-5 reveal">
            <div className="rounded-xl overflow-hidden shadow-soft" style={{ height: 380 }}>
              <iframe
                title="SANYOD on the map"
                src="https://www.google.com/maps?q=Mapusa,+Goa&output=embed"
                style={{ border: 0, width: '100%', height: '100%' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
