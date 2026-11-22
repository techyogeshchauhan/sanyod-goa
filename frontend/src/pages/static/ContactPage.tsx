import { useQuery } from '@tanstack/react-query';
import { PageHero } from '@/components/ui';
import { PageError } from '@/components/common/PageState';
import { settingsApi } from '@/api/catalog';
import { ContactForm } from './ContactForm';

/** Contact (contact.php). */
export default function ContactPage() {
  const { data: settings, isLoading, error } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.public });
  const cards = settings ? [
    ...(settings.location ? [{ icon: 'fas fa-map-marker-alt', title: 'Visit', text: settings.location, href: '' }] : []),
    ...(settings.contactEmail ? [{ icon: 'fas fa-envelope', title: 'Email', text: settings.contactEmail, href: `mailto:${settings.contactEmail}` }] : []),
    ...(settings.contactPhone ? [{ icon: 'fas fa-phone-alt', title: 'Call', text: settings.contactPhone, href: `tel:${settings.contactPhone}` }] : []),
  ] : [];
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
                {isLoading && <div className="text-center py-3"><span className="spinner-border spinner-border-sm" role="status" /></div>}
                {error && <PageError error={error} />}
                {!isLoading && cards.length === 0 && !error && <div className="alert alert-info">Contact details have not been configured yet.</div>}
                {cards.map((c) => (
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
                {!!settings?.workingHours.length && <div className="card-soft reveal">
                  <div className="d-flex gap-3 align-items-center mb-3">
                    <span className="icon-badge indigo mb-0">
                      <i className="fas fa-clock"></i>
                    </span>
                    <h3 className="h5 mb-0">Opening hours</h3>
                  </div>
                  <ul className="list-unstyled mb-0 small">
                    {settings.workingHours.map((h) => (
                      <li key={h.label} className="d-flex justify-content-between py-1 border-bottom" style={{ borderColor: 'var(--line)' }}>
                        <span className="text-muted">{h.label.replace(':', '')}</span>
                        <span className="text-ink fw-600 text-end">{h.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>}
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
          {settings?.location && <div className="mt-4 reveal">
            <div className="rounded-xl overflow-hidden shadow-soft" style={{ height: 380 }}>
              <iframe
                title="SANYOD on the map"
                src={`https://www.google.com/maps?q=${encodeURIComponent(settings.location)}&output=embed`}
                style={{ border: 0, width: '100%', height: '100%' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>}
        </div>
      </section>
    </>
  );
}
