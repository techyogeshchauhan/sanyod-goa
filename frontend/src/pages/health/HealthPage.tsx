import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DoctorCategory } from '@shared/types/catalog';
import { healthApi } from '@/api/catalog';
import { DoctorPhoto } from '@/components/common/DoctorPhoto';
import { EmptyState, PageHero, Spinner } from '@/components/ui';
import { rupees } from '@/utils/format';

const CATEGORIES: { id: DoctorCategory; label: string; icon: string; title: string }[] = [
  { id: 'physical', label: 'Physical Health', icon: 'fas fa-heartbeat', title: 'Physical health specialists' },
  { id: 'mental', label: 'Mental Health', icon: 'fas fa-brain', title: 'Mental health specialists' },
  { id: 'chronical', label: 'Chronic Disease', icon: 'fas fa-user-injured', title: 'Chronic disease specialists' },
];

/** Health Consultation Portal (health.php). */
export default function HealthPage() {
  const [active, setActive] = useState<DoctorCategory>('physical');
  const { data: doctors, isLoading } = useQuery({ queryKey: ['doctors'], queryFn: healthApi.doctors });
  const list = (doctors ?? []).filter((d) => d.categories.some((c) => c.category === active));
  const current = CATEGORIES.find((c) => c.id === active);

  return (
    <>
      <PageHero
        crumbs={[{ label: 'Health' }]}
        eyebrow="Health consultation"
        title="Consult experienced doctors, online"
        lead="Naturopathy, Ayurveda and homeopathy specialists for physical, mental and chronic conditions. Book a teleconsultation in a few minutes."
      />
      <section className="section">
        <div className="container">
          <div className="segmented mb-4" role="tablist" aria-label="Doctor categories">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active === c.id}
                className={`category-tab${active === c.id ? ' active' : ''}`}
                onClick={() => setActive(c.id)}
              >
                <i className={c.icon}></i> {c.label}
              </button>
            ))}
          </div>
          <h2 className="h3 mb-4">{current?.title}</h2>
          {isLoading && <Spinner />}
          {!isLoading && list.length === 0 && <EmptyState icon="fas fa-user-md" title="No specialists yet" text="No specialists are listed in this category yet." />}
          <div className="row g-4">
            {list.map((d) => (
              <div className="col-md-6 col-lg-4" key={d.id}>
                <Link to={`/health/doctors/${d.slug}`} className="card-soft hover reveal d-flex flex-column doctor-card text-decoration-none">
                  <div className="d-flex gap-3 align-items-center mb-3">
                    <span className="doctor-avatar">
                      <DoctorPhoto src={d.photo} alt="" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="h5 mb-1">Dr. {d.name}</h3>
                      <div className="small text-muted">
                        {[d.qualification, d.experienceYears != null ? `${d.experienceYears} years experience` : null].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                  <p className="small text-muted deva clamp-3">{d.categories.find((x) => x.category === active)?.specialisations}</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto pt-2">
                    <span>
                      <span className="small text-muted">Fee </span>
                      <span className="fw-600 text-ink">{rupees(d.fee, false)}</span>
                    </span>
                    <span className="btn btn-light btn-sm btn-detail">
                      View profile <i className="fas fa-arrow-right"></i>
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
