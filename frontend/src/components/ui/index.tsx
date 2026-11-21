// Building blocks of the SANYOD design system (styles in src/styles/theme.css).
import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Gently fades `.reveal` elements in as they scroll into view. Mounted once in the layout; a
 * MutationObserver picks up elements rendered later (lazy pages, data that arrives afterwards).
 */
export function useReveal() {
  useEffect(() => {
    const seen = new WeakSet<Element>();
    if (!('IntersectionObserver' in window)) {
      const showAll = () => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      showAll();
      const mo = new MutationObserver(showAll);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 },
    );
    const scan = () => {
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);
}

export interface Crumb {
  label: string;
  to?: string;
}

/** Top band of an inner page: breadcrumb, eyebrow, title, lead and actions. */
export function PageHero({
  eyebrow,
  deva,
  title,
  lead,
  crumbs,
  actions,
  center = false,
  compact = false,
  children,
}: {
  eyebrow?: string;
  deva?: string;
  title: ReactNode;
  lead?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  center?: boolean;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={`page-hero${center ? ' center' : ''}${compact ? ' compact' : ''}`}>
      <div className="container position-relative" style={{ zIndex: 1 }}>
        {crumbs && (
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            {crumbs.map((c) => (
              <span key={c.label}>{c.to ? <Link to={c.to}>{c.label}</Link> : c.label}</span>
            ))}
          </nav>
        )}
        {deva && <div className="eyebrow-deva">{deva}</div>}
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {actions && <div className="hero-actions">{actions}</div>}
        {children}
      </div>
    </section>
  );
}

/** A page section with an optional centered header. */
export function Section({
  id,
  eyebrow,
  deva,
  title,
  lead,
  tone,
  size,
  children,
  headStart = false,
}: {
  id?: string;
  eyebrow?: string;
  deva?: string;
  title?: ReactNode;
  lead?: ReactNode;
  tone?: 'alt' | 'white' | 'ink';
  size?: 'sm';
  children: ReactNode;
  headStart?: boolean;
}) {
  return (
    <section id={id} className={`section${size ? ` section-${size}` : ''}${tone ? ` section-${tone}` : ''}`}>
      <div className="container">
        {(title || eyebrow || deva) && (
          <div className={`section-head reveal${headStart ? ' text-start' : ''}`}>
            {deva && <div className="eyebrow-deva">{deva}</div>}
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h2>{title}</h2>}
            {lead && <p className="lead mb-0">{lead}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export type Tone = 'saffron' | 'indigo' | 'sage' | 'rose' | 'gold' | 'sky';
export const TONES: Tone[] = ['saffron', 'indigo', 'sage', 'gold', 'sky', 'rose'];
export const toneClass = (t: Tone | undefined) => (t && t !== 'saffron' ? ` ${t}` : '');

/** Icon + title + text card. */
export function FeatureCard({
  icon,
  title,
  text,
  tone,
  children,
  className = '',
}: {
  icon: string;
  title: ReactNode;
  text?: ReactNode;
  tone?: Tone;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-soft hover reveal ${className}`}>
      <span className={`icon-badge${toneClass(tone)}`}>
        <i className={icon}></i>
      </span>
      <h3 className="h4">{title}</h3>
      {text && <p className="text-muted">{text}</p>}
      {children}
    </div>
  );
}

/** Row of big numbers. */
export function StatRow({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="stat-row">
      {items.map((s) => (
        <div className="stat reveal" key={s.label}>
          <div className="value">{s.value}</div>
          <div className="label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Initials avatar (people without a real photo). */
export function Avatar({ name, size }: { name: string; size?: 'lg' }) {
  const initials = name
    .replace(/^(dr|swami|acharya|yoga acharya)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <span className={`avatar${size ? ` ${size}` : ''}`} aria-hidden="true">
      {initials}
    </span>
  );
}

export function QuoteCard({ quote, cite, children }: { quote: ReactNode; cite?: ReactNode; children?: ReactNode }) {
  return (
    <figure className="card-soft quote-card reveal m-0">
      <blockquote>{quote}</blockquote>
      {cite && <cite>{cite}</cite>}
      {children}
    </figure>
  );
}

/** Dark call-to-action band. */
export function CtaBand({ deva, title, lead, actions, children }: { deva?: string; title: ReactNode; lead?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="cta-band reveal">
      {deva && <div className="eyebrow-deva">{deva}</div>}
      <h2 className="mb-3">{title}</h2>
      {lead && <p className="lead mb-0">{lead}</p>}
      {actions && <div className="hero-actions justify-content-center">{actions}</div>}
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, text, children }: { icon: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="icon-badge lg">
        <i className={icon}></i>
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children && <div className="d-flex gap-2 justify-content-center flex-wrap mt-3">{children}</div>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  pending: 'gold',
  approved: 'sage',
  rejected: 'rose',
  processing: 'sky',
  shipped: 'indigo',
  delivered: 'sage',
  cancelled: 'muted',
  confirmed: 'sage',
  completed: 'sage',
};

/** Small coloured status label. */
export function StatusChip({ status, label }: { status: string; label?: string }) {
  return <span className={`chip ${STATUS_TONE[status] ?? 'muted'}`}>{label ?? status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

/** Centered spinner for loading pages and sections. */
export function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="text-center py-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">{label}</span>
      </div>
    </div>
  );
}
