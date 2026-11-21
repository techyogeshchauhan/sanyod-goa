import type { ReactNode } from 'react';

/** Two-column layout of the account pages: form card + calm image panel. */
export function AuthShell({
  cardClass,
  icon,
  title,
  subtitle,
  children,
  footer,
}: {
  /** Hook class kept for tests and styling: login-card, register-card … */
  cardClass: string;
  icon: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="auth-wrap">
      <div className="container">
        <div className="auth-grid">
          <div className={`auth-card ${cardClass}`}>
            <span className="icon-badge">
              <i className={icon}></i>
            </span>
            <h1 className="h2 mb-2 auth-title">{title}</h1>
            {subtitle && <p className="text-muted mb-4">{subtitle}</p>}
            {children}
            {footer && <div className="auth-footer">{footer}</div>}
          </div>
          <aside className="auth-aside" aria-hidden="true">
            {/* The chakra chart is shown whole, with the quote below it (not over it). */}
            <div className="auth-aside-media">
              <img src="/images/IMG-20250921-WA0003.jpg" alt="" />
            </div>
            <div className="auth-aside-inner">
              <div className="eyebrow-deva">योगः कर्मसु कौशलम्</div>
              <p className="h4 mb-1">“Yoga is skill in action.”</p>
              <p className="small text-muted mb-0">Bhagavad Gita 2.50</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
