// Generated from reference/live-html/lab.html by scripts/html-to-jsx.mjs, then edited by hand.
// Markup, classes and texts match the live page; styles: src/styles/pages/library.page.css

export function Main() {
  return (
    <main>
      <div className="library-bg"></div>
      <div className="library-pattern"></div>
      <div className="floating-book" style={{ top: "15%", left: "5%" }}></div>
      <div className="floating-book" style={{ top: "25%", right: "10%", background: "var(--gradient-wisdom)" }}></div>
      <div className="floating-book" style={{ bottom: "35%", left: "15%", background: "linear-gradient(135deg, #800000 0%, #B87333 100%)" }}></div>
      <div className="floating-book" style={{ bottom: "45%", right: "5%", background: "linear-gradient(135deg, #008080 0%, #8A9A5B 100%)" }}></div>
      <section className="library-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center">
              <div className="sanskrit-library">
                विद्याधनं सर्वधनप्रधानम्
              </div>
              <h1 className="hero-title-library">
                {' '}Spiritual Library{' '}
              </h1>
              <p className="hero-subtitle-library">
                {' '}Explore the world's largest digital collection of ancient scriptures, spiritual texts, and wisdom literature. Journey through millennia of spiritual knowledge preserved for modern seekers.{' '}
              </p>
              <div className="hero-buttons mt-4">
                <a href="#explore" className="btn-library me-3 mb-3">
                  <i className="fas fa-book-open me-2"></i>
                  Explore Library{' '}
                </a>
                {' '}
                <a href="#search" className="btn-library-outline mb-3">
                  <i className="fas fa-search me-2"></i>
                  Search Texts{' '}
                </a>
              </div>
              <div className="mt-5">
                <div className="row justify-content-center">
                  <div className="col-auto">
                    <div className="text-center">
                      <h3 className="text-maroon">
                        10,000+
                      </h3>
                      <p className="text-muted">
                        Ancient Texts
                      </p>
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="text-center">
                      <h3 className="text-indigo">
                        5,000+
                      </h3>
                      <p className="text-muted">
                        Years of Wisdom
                      </p>
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="text-center">
                      <h3 className="text-copper">
                        50+
                      </h3>
                      <p className="text-muted">
                        Languages
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="categories-library" id="explore">
        <div className="container">
          <div className="section-header-library">
            <div className="sanskrit-library">
              ज्ञान विभागाः
            </div>
            <h2 className="section-title-library">
              Sacred{' '}
              <span style={{ color: "var(--library-maroon)" }}>
                Categories
              </span>
            </h2>
            <p className="section-subtitle-library">
              Browse our extensive collection of spiritual texts by category
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="category-card-library">
                <div className="category-icon-library">
                  <i className="fas fa-om"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  {"Vedas & Upanishads"}
                </h4>
                <p className="text-muted">
                  The foundational scriptures of Sanatana Dharma
                </p>
                <a href="#" className="btn-library-outline w-100 mt-3">
                  Explore
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="category-card-library">
                <div className="category-icon-library">
                  <i className="fas fa-book"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  {"Puranas & Itihasas"}
                </h4>
                <p className="text-muted">
                  Ancient histories and mythological texts
                </p>
                <a href="#" className="btn-library-outline w-100 mt-3">
                  Explore
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="category-card-library">
                <div className="category-icon-library">
                  <i className="fas fa-yin-yang"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  {"Yoga & Meditation"}
                </h4>
                <p className="text-muted">
                  Texts on spiritual practices and disciplines
                </p>
                <a href="#" className="btn-library-outline w-100 mt-3">
                  Explore
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="category-card-library">
                <div className="category-icon-library">
                  <i className="fas fa-leaf"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  {"Ayurveda & Healing"}
                </h4>
                <p className="text-muted">
                  Ancient wisdom on health and wellbeing
                </p>
                <a href="#" className="btn-library-outline w-100 mt-3">
                  Explore
                </a>
              </div>
            </div>
          </div>
          <div className="row g-4 mt-4">
            <div className="col-md-6 col-lg-3">
              <div className="category-card-library">
                <div className="category-icon-library">
                  <i className="fas fa-dharmachakra"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  Buddhist Texts
                </h4>
                <p className="text-muted">
                  Sutras, commentaries, and meditation guides
                </p>
                <a href="#" className="btn-library-outline w-100 mt-3">
                  Explore
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="category-card-library">
                <div className="category-icon-library">
                  <i className="fas fa-cross"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  Comparative Religion
                </h4>
                <p className="text-muted">
                  Sacred texts from world religions
                </p>
                <a href="#" className="btn-library-outline w-100 mt-3">
                  Explore
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="category-card-library">
                <div className="category-icon-library">
                  <i className="fas fa-microphone-alt"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  {"Discourses & Lectures"}
                </h4>
                <p className="text-muted">
                  Modern interpretations by spiritual masters
                </p>
                <a href="#" className="btn-library-outline w-100 mt-3">
                  Explore
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="category-card-library">
                <div className="category-icon-library">
                  <i className="fas fa-language"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  Sanskrit Studies
                </h4>
                <p className="text-muted">
                  Grammar, dictionaries, and learning resources
                </p>
                <a href="#" className="btn-library-outline w-100 mt-3">
                  Explore
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="scriptures-library">
        <div className="container">
          <div className="section-header-library">
            <div className="sanskrit-library">
              प्रमुख ग्रन्थाः
            </div>
            <h2 className="section-title-library">
              Featured{' '}
              <span style={{ color: "var(--library-maroon)" }}>
                Scriptures
              </span>
            </h2>
            <p className="section-subtitle-library">
              Explore our most treasured spiritual texts
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="scripture-card-library">
                <div className="book-spine"></div>
                <div className="position-relative">
                  <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" className="scripture-img-library" alt="Bhagavad Gita" />
                  <div className="scripture-overlay-library">
                    <div className="scripture-badge-library">
                      Most Read
                    </div>
                  </div>
                </div>
                <div className="scripture-content-library">
                  <h4 className="text-indigo mb-3">
                    Bhagavad Gita
                  </h4>
                  <p className="text-muted mb-3">
                    The celestial song containing the essence of Vedic wisdom. 700 verses of dialogue.
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="fas fa-clock text-copper me-1"></i>
                      {' '}
                      <span className="text-muted">
                        500 BCE
                      </span>
                    </div>
                    <a href="#" className="btn-library btn-sm">
                      Read Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="scripture-card-library">
                <div className="book-spine" style={{ background: "linear-gradient(to right, #228B22 0%, #8A9A5B 100%)" }}></div>
                <div className="position-relative">
                  <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" className="scripture-img-library" alt="Yoga Sutras" />
                  <div className="scripture-overlay-library">
                    <div className="scripture-badge-library" style={{ background: "var(--gradient-wisdom)" }}>
                      Yoga Text
                    </div>
                  </div>
                </div>
                <div className="scripture-content-library">
                  <h4 className="text-indigo mb-3">
                    Yoga Sutras of Patanjali
                  </h4>
                  <p className="text-muted mb-3">
                    196 aphorisms outlining the philosophy and practice of classical yoga.
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="fas fa-clock text-copper me-1"></i>
                      {' '}
                      <span className="text-muted">
                        400 CE
                      </span>
                    </div>
                    <a href="#" className="btn-library btn-sm">
                      Read Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="scripture-card-library">
                <div className="book-spine" style={{ background: "linear-gradient(to right, #800000 0%, #B87333 100%)" }}></div>
                <div className="position-relative">
                  <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" className="scripture-img-library" alt="Upanishads" />
                  <div className="scripture-overlay-library">
                    <div className="scripture-badge-library" style={{ background: "linear-gradient(135deg, #800000 0%, #B87333 100%)" }}>
                      Philosophy
                    </div>
                  </div>
                </div>
                <div className="scripture-content-library">
                  <h4 className="text-indigo mb-3">
                    Principal Upanishads
                  </h4>
                  <p className="text-muted mb-3">
                    13 major Upanishads containing the philosophical essence of the Vedas.
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="fas fa-clock text-copper me-1"></i>
                      {' '}
                      <span className="text-muted">
                        800-200 BCE
                      </span>
                    </div>
                    <a href="#" className="btn-library btn-sm">
                      Read Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="manuscripts-library">
        <div className="container">
          <div className="section-header-library">
            <div className="sanskrit-library">
              प्राचीन पाण्डुलिपयः
            </div>
            <h2 className="section-title-library">
              Ancient{' '}
              <span style={{ color: "var(--library-copper)" }}>
                Manuscripts
              </span>
            </h2>
            <p className="section-subtitle-library">
              Digitally preserved manuscripts from ancient times
            </p>
          </div>
          <div className="row">
            <div className="col-lg-10 mx-auto">
              <div className="manuscript-card-library">
                <span className="manuscript-age">
                  ~1500 BCE
                </span>
                <h3 className="text-maroon mb-3">
                  Rigveda Samhita
                </h3>
                <p className="text-muted mb-3">
                  The oldest extant Indo-European text. Contains 1,028 hymns (sūktas) in about 10,600 verses, organized into ten books (maṇḍalas).
                </p>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className="fas fa-scroll text-copper me-2"></i>
                    {' '}
                    <span className="text-muted">
                      Original Sanskrit with translations
                    </span>
                  </div>
                  <a href="#" className="btn-library-outline">
                    View Manuscript
                  </a>
                </div>
              </div>
              <div className="manuscript-card-library">
                <span className="manuscript-age">
                  ~500 BCE
                </span>
                <h3 className="text-maroon mb-3">
                  Charaka Samhita
                </h3>
                <p className="text-muted mb-3">
                  Ancient Sanskrit text on Ayurveda (Indian traditional medicine). Along with Sushruta Samhita, it is one of the two foundational texts of this field.
                </p>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className="fas fa-heart text-copper me-2"></i>
                    {' '}
                    <span className="text-muted">
                      Ayurvedic medicine text
                    </span>
                  </div>
                  <a href="#" className="btn-library-outline">
                    View Manuscript
                  </a>
                </div>
              </div>
              <div className="manuscript-card-library">
                <span className="manuscript-age">
                  ~300 BCE
                </span>
                <h3 className="text-maroon mb-3">
                  Arthashastra
                </h3>
                <p className="text-muted mb-3">
                  Ancient Indian Sanskrit treatise on statecraft, economic policy and military strategy. Authored by Kautilya, also known as Chanakya.
                </p>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className="fas fa-landmark text-copper me-2"></i>
                    {' '}
                    <span className="text-muted">
                      Political science text
                    </span>
                  </div>
                  <a href="#" className="btn-library-outline">
                    View Manuscript
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="digital-library">
        <div className="container">
          <div className="section-header-library">
            <div className="sanskrit-library">
              आभासी पुस्तकालयः
            </div>
            <h2 className="section-title-library">
              Digital{' '}
              <span style={{ color: "var(--library-teal)" }}>
                Access
              </span>
            </h2>
            <p className="section-subtitle-library">
              Access our spiritual library from anywhere in the world
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="digital-card-library">
                <div className="digital-icon">
                  <i className="fas fa-book-reader"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  Read Online
                </h4>
                <p className="text-muted mb-3">
                  Access complete texts with beautiful typography and easy navigation
                </p>
                <a href="#" className="btn-library w-100" style={{ background: "var(--gradient-wisdom)" }}>
                  Start Reading
                </a>
              </div>
            </div>
            <div className="col-md-4">
              <div className="digital-card-library">
                <div className="digital-icon">
                  <i className="fas fa-headphones"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  Audio Scriptures
                </h4>
                <p className="text-muted mb-3">
                  Listen to sacred texts narrated by traditional scholars
                </p>
                <a href="#" className="btn-library w-100">
                  Listen Now
                </a>
              </div>
            </div>
            <div className="col-md-4">
              <div className="digital-card-library">
                <div className="digital-icon">
                  <i className="fas fa-download"></i>
                </div>
                <h4 className="text-indigo mb-3">
                  Download Texts
                </h4>
                <p className="text-muted mb-3">
                  Download PDFs and eBooks for offline study
                </p>
                <a href="#" className="btn-library w-100" style={{ background: "linear-gradient(135deg, #008080 0%, #8A9A5B 100%)" }}>
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="search-library" id="search">
        <div className="container">
          <div className="section-header-library">
            <div className="sanskrit-library">
              अन्वेषण
            </div>
            <h2 className="section-title-library">
              Search Our{' '}
              <span style={{ color: "var(--library-copper)" }}>
                Library
              </span>
            </h2>
            <p className="section-subtitle-library">
              Find specific texts, verses, or topics across our entire collection
            </p>
          </div>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="search-box-library">
                <div className="input-group mb-4">
                  <input type="text" className="search-input-library" placeholder="Search for scriptures, verses, or topics..." />
                  {' '}
                  <button className="btn-library" type="button" style={{ borderRadius: "0 5px 5px 0" }}>
                    <i className="fas fa-search"></i>
                  </button>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-copper">
                        Category
                      </label>
                      <select className="form-select" style={{ background: "var(--library-parchment)", borderColor: "var(--library-copper)" }}>
                        <option>
                          All Categories
                        </option>
                        <option>
                          Vedas
                        </option>
                        <option>
                          Upanishads
                        </option>
                        <option>
                          Puranas
                        </option>
                        <option>
                          Yoga Texts
                        </option>
                        <option>
                          Ayurveda
                        </option>
                        <option>
                          Philosophy
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-copper">
                        Language
                      </label>
                      <select className="form-select" style={{ background: "var(--library-parchment)", borderColor: "var(--library-copper)" }}>
                        <option>
                          All Languages
                        </option>
                        <option>
                          Sanskrit
                        </option>
                        <option>
                          Hindi
                        </option>
                        <option>
                          English
                        </option>
                        <option>
                          Tamil
                        </option>
                        <option>
                          Bengali
                        </option>
                        <option>
                          Multiple Languages
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <a href="#" className="btn-library-outline me-3">
                    <i className="fas fa-random me-2"></i>
                    Random Scripture{' '}
                  </a>
                  {' '}
                  <a href="#" className="btn-library">
                    <i className="fas fa-star me-2"></i>
                    Featured Today{' '}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="resources-library">
        <div className="container">
          <div className="section-header-library">
            <div className="sanskrit-library">
              अध्ययन साधनानि
            </div>
            <h2 className="section-title-library">
              Study{' '}
              <span style={{ color: "var(--library-moss)" }}>
                Resources
              </span>
            </h2>
            <p className="section-subtitle-library">
              Tools and resources to deepen your understanding
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="resource-card-library">
                <div className="resource-badge-library">
                  Dictionary
                </div>
                <div className="p-4">
                  <h4 className="text-indigo mb-3">
                    Sanskrit-English Dictionary
                  </h4>
                  <p className="text-muted mb-3">
                    Comprehensive dictionary with 50,000+ words and meanings
                  </p>
                  <a href="#" className="btn-library-outline w-100">
                    Access
                  </a>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="resource-card-library">
                <div className="resource-badge-library" style={{ background: "var(--gradient-scripture)" }}>
                  Commentary
                </div>
                <div className="p-4">
                  <h4 className="text-indigo mb-3">
                    Bhagavad Gita Commentaries
                  </h4>
                  <p className="text-muted mb-3">
                    50+ traditional and modern commentaries
                  </p>
                  <a href="#" className="btn-library-outline w-100">
                    Access
                  </a>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="resource-card-library">
                <div className="resource-badge-library" style={{ background: "var(--gradient-wisdom)" }}>
                  Course
                </div>
                <div className="p-4">
                  <h4 className="text-indigo mb-3">
                    Scripture Study Courses
                  </h4>
                  <p className="text-muted mb-3">
                    Structured learning paths for major texts
                  </p>
                  <a href="#" className="btn-library-outline w-100">
                    Access
                  </a>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="resource-card-library">
                <div className="resource-badge-library" style={{ background: "linear-gradient(135deg, #008080 0%, #8A9A5B 100%)" }}>
                  Research
                </div>
                <div className="p-4">
                  <h4 className="text-indigo mb-3">
                    Academic Papers
                  </h4>
                  <p className="text-muted mb-3">
                    5000+ research papers on Indian philosophy
                  </p>
                  <a href="#" className="btn-library-outline w-100">
                    Access
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="stats-library">
        <div className="container">
          <div className="row">
            <div className="col-md-3 col-6">
              <div className="stat-card-library">
                <div className="stat-icon-library">
                  <i className="fas fa-scroll"></i>
                </div>
                <div className="stat-number-library">
                  10
                  <span style={{ fontSize: "2rem" }}>
                    K+
                  </span>
                </div>
                <div className="stat-label" style={{ color: "rgba(255,255,255,0.9)" }}>
                  DIGITAL TEXTS
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card-library">
                <div className="stat-icon-library">
                  <i className="fas fa-language"></i>
                </div>
                <div className="stat-number-library">
                  50
                  <span style={{ fontSize: "2rem" }}>
                    +
                  </span>
                </div>
                <div className="stat-label" style={{ color: "rgba(255,255,255,0.9)" }}>
                  LANGUAGES
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card-library">
                <div className="stat-icon-library">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-number-library">
                  100
                  <span style={{ fontSize: "2rem" }}>
                    K+
                  </span>
                </div>
                <div className="stat-label" style={{ color: "rgba(255,255,255,0.9)" }}>
                  MONTHLY READERS
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card-library">
                <div className="stat-icon-library">
                  <i className="fas fa-hourglass-half"></i>
                </div>
                <div className="stat-number-library">
                  5000
                  <span style={{ fontSize: "2rem" }}>
                    +
                  </span>
                </div>
                <div className="stat-label" style={{ color: "rgba(255,255,255,0.9)" }}>
                  YEARS OF WISDOM
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="categories-library">
        <div className="container">
          <div className="row justify-content-center align-items-center">
            <div className="col-lg-8 text-center">
              <div className="sanskrit-library mb-4">
                पुस्तकस्था तु या विद्या परहस्तगतं धनम्
              </div>
              <h2 className="section-title-library">
                Start Your Spiritual Reading Journey
              </h2>
              <p className="section-subtitle-library mb-4">
                {' '}Join thousands of spiritual seekers who study and contemplate ancient wisdom daily. Access is completely free for all sincere students.{' '}
              </p>
              <div className="hero-buttons">
                <a href="#" className="btn-library me-3">
                  <i className="fas fa-user-plus me-2"></i>
                  Create Free Account{' '}
                </a>
                {' '}
                <a href="#" className="btn-library-outline">
                  <i className="fas fa-bookmark me-2"></i>
                  Save Library{' '}
                </a>
              </div>
              <div className="row mt-5 justify-content-center">
                <div className="col-auto">
                  <div className="text-center">
                    <h3 className="text-copper">
                      100%
                    </h3>
                    <p className="text-muted">
                      Free Access
                    </p>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="text-center">
                    <h3 className="text-maroon">
                      24/7
                    </h3>
                    <p className="text-muted">
                      Available
                    </p>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="text-center">
                    <h3 className="text-indigo">
                      No Ads
                    </h3>
                    <p className="text-muted">
                      Distraction-Free
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function SpiritualLibraryContent() {
  return (
    <>
      <Main />
    </>
  );
}
