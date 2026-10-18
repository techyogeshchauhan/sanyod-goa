// Generated from reference/live-html/health.html by scripts/html-to-jsx.mjs, then edited by hand:
// doctors come from GET /api/doctors, grouped by category. Markup, classes and texts match the
// live page; styles: src/styles/pages/health.page.css
import type { CSSProperties, MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { DoctorCategory, DoctorSummary } from '@shared/types/catalog';
import { DoctorPhoto } from '@/components/common/DoctorPhoto';
import { rupees } from '@/utils/format';

const CATEGORIES: { id: DoctorCategory; tab: string; icon: string; title: string; titleStyle?: CSSProperties }[] = [
  { id: 'physical', tab: 'Physical Health', icon: 'fas fa-heartbeat', title: 'Physical Health Specialists', titleStyle: { color: '#27ae60', fontWeight: '900' } },
  { id: 'mental', tab: 'Mental Health', icon: 'fas fa-brain', title: 'Mental Health Specialists' },
  { id: 'chronical', tab: 'Chronic Disease', icon: 'fas fa-user-injured', title: 'Chronic Disease Specialists' },
];

interface Props {
  doctors: DoctorSummary[] | undefined;
  isLoading: boolean;
  active: DoctorCategory;
  onTab: (c: DoctorCategory) => void;
}

export default function HealthContent({ doctors, isLoading, active, onTab }: Props) {
  const navigate = useNavigate();
  // Live: a click anywhere on the card opens the doctor's page.
  const openCard = (slug: string) => (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.btn-detail, .btn-cv')) navigate(`/health/doctors/${slug}`);
  };

  return (
    <div className="container">
      <h1 className="page-title" style={{ color: 'darkred', fontWeight: '900' }}>
        Health Consultation Portal
      </h1>
      <div className="categories-tabs">
        {CATEGORIES.map((c) => (
          <div
            key={c.id}
            className={`category-tab${active === c.id ? ' active' : ''}`}
            data-category={c.id}
            role="tab"
            tabIndex={0}
            aria-selected={active === c.id}
            onClick={() => onTab(c.id)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTab(c.id)}
          >
            <i className={c.icon}></i> {c.tab}
          </div>
        ))}
      </div>
      {CATEGORIES.map((c) => {
        const list = (doctors ?? []).filter((d) => d.categories.some((x) => x.category === c.id));
        return (
          <div key={c.id} className={`category-content${active === c.id ? ' active' : ''}`} id={`${c.id}-content`}>
            <h2 className="category-title" style={c.titleStyle}>
              {c.title}
            </h2>
            {isLoading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            {!isLoading && list.length === 0 && <p className="text-muted">No specialists listed in this category yet.</p>}
            <div className="doctors-grid">
              {list.map((d) => (
                <div className="doctor-card" key={d.id} onClick={openCard(d.slug)} role="link" style={{ cursor: 'pointer' }}>
                  <div className="doctor-header">
                    <div className="doctor-avatar">
                      <DoctorPhoto src={d.photo} alt={`Dr. ${d.name}`} />
                    </div>
                    <div className="doctor-title">
                      <h3>Dr. {d.name}</h3>
                      <div className="specialization">{d.categories.find((x) => x.category === c.id)?.specialisations}</div>
                    </div>
                  </div>
                  <div className="doctor-body">
                    {d.qualification && (
                      <div className="doctor-info-item">
                        <i className="fas fa-graduation-cap"></i>
                        <span>{d.qualification}</span>
                      </div>
                    )}
                    {d.experienceYears != null && (
                      <div className="doctor-info-item">
                        <i className="fas fa-briefcase"></i>
                        <span>{d.experienceYears} years experience</span>
                      </div>
                    )}
                    <p className="doctor-bio"></p>
                  </div>
                  <div className="doctor-footer">
                    <div className="doctor-fee">
                      {' '}Fee: <span>{rupees(d.fee, false)}</span>
                    </div>
                    <div className="doctor-actions">
                      <Link to={`/health/doctors/${d.slug}`} className="btn-detail">
                        <i className="fas fa-eye"></i> View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
