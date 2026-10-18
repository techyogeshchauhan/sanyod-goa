import { SITE } from '@/config/site';

/** Topbar (header.php "Topbar Start"). */
export function TopBar() {
  return (
    <div className="container-fluid topbar bg-secondary w-100">
      <div className="container">
        <div className="row gx-0 align-items-center" style={{ minHeight: '45px' }}>
          <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
            <div className="d-flex flex-wrap justify-content-center justify-content-md-start">
              <a href="#" className="text-white me-2 me-md-4 small" onClick={(e) => e.preventDefault()}>
                <i className="fas fa-map-marker-alt text-primary me-2" style={{ color: '#fff' }}></i>
                {SITE.location}
              </a>
              <a href={`tel:${SITE.phone}`} className="text-white me-2 me-md-4 small">
                <i className="fas fa-phone-alt text-primary me-2" style={{ color: '#fff' }}></i>
                {SITE.phone}
              </a>
              <a href={`mailto:${SITE.email}`} className="text-white small">
                <i className="fas fa-envelope text-primary me-2" style={{ color: '#fff' }}></i>
                {SITE.email}
              </a>
            </div>
          </div>
          <div className="col-md-6 text-center text-md-end mt-2 mt-md-0">
            <div className="d-flex align-items-center justify-content-center justify-content-md-end">
              <a href={SITE.social.facebook} className="btn btn-light btn-sm-square rounded-circle me-2 me-md-3" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href={SITE.social.twitter} className="btn btn-light btn-sm-square rounded-circle me-2 me-md-3" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href={SITE.social.instagram} className="btn btn-light btn-sm-square rounded-circle me-2 me-md-3" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href={SITE.social.linkedin} className="btn btn-light btn-sm-square rounded-circle" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
