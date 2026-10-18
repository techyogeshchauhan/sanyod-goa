// Generated from reference/live-html/index.html by scripts/html-to-jsx.mjs, then edited by hand.
// Markup, classes and texts match the live page; styles: src/styles/pages/home.page.css
// Edited: courses come from the API; Quick Access tiles navigate via props.
import { Link } from 'react-router-dom';
import type { CourseSummary, HomeCourses } from '@shared/types/course';
import { previewByBytes } from '@shared/utils/text';

export function AnimatedBg() {
  return (
    <div className="animated-bg"></div>
  );
}

export function AnimatedBgOverlay() {
  return (
    <div className="animated-bg-overlay"></div>
  );
}

export function ColorParticles() {
  return (
    <div id="color-particles"></div>
  );
}

export function Block1() {
  return (
    <div className="color-block block-1"></div>
  );
}

export function Block2() {
  return (
    <div className="color-block block-2"></div>
  );
}

export function SanskritDecoration() {
  return (
    <div className="sanskrit-decoration" style={{ top: "10%", left: "5%" }}>
      ॐ
    </div>
  );
}

export function SanskritDecoration2() {
  return (
    <div className="sanskrit-decoration" style={{ bottom: "10%", right: "5%" }}>
      संस्कृतम्
    </div>
  );
}

export function HeroVibrant() {
  return (
    <section className="hero-vibrant">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-8 mx-auto text-center">
            <h1 className="hero-title-vibrant floating">
              {' '}{"Learn Sanskrit & Indian Wisdom Online in Hindi"}{' '}
            </h1>
            <p className="hero-subtitle-vibrant">
              {' '}Master ancient knowledge through expert-led video classes. Join 1 Lakh+ satisfied learners on their spiritual journey. Experience the colors of wisdom!{' '}
            </p>
            <div className="hero-buttons mt-4">
              <a href="#" className="btn btn-saffron btn-colorful me-3 mb-3">
                <i className="fas fa-search me-2"></i>
                Find Your Course{' '}
              </a>
              {' '}
              <a href="#" className="btn btn-indigo btn-colorful mb-3">
                <i className="fas fa-play-circle me-2"></i>
                Watch Introduction{' '}
              </a>
            </div>
            <div className="mt-5">
              <div className="progress-bar-vibrant"></div>
              <p className="text-muted">
                Start your journey today and join our vibrant community
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesVibrant() {
  return (
    <section className="features-vibrant">
      <div className="container">
        <div className="section-header-vibrant">
          <h2 className="section-title-vibrant">
            Experience Wisdom in Color
          </h2>
          <p className="section-subtitle-vibrant">
            Watch our vibrant introduction to understand the depth and beauty of Sanskrit learning
          </p>
        </div>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="ratio ratio-16x9" style={{ borderRadius: "var(--border-radius-large)", overflow: "hidden", boxShadow: "var(--shadow-vibrant)", border: "5px solid white" }}>
              <iframe src="https://www.youtube.com/embed/ey3lX6OpVps?autoplay=0&rel=0" title="Sanskrit Learning Experience" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
            <div className="text-center mt-5">
              <a href="#" className="btn btn-emerald btn-colorful" style={{ fontSize: "1.3rem", padding: "1.2rem 4rem" }}>
                <i className="fas fa-gem me-2"></i>
                Start Colorful Journey{' '}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoriesVibrant() {
  return (
    <section className="categories-vibrant">
      <div className="container">
        <div className="section-header-vibrant">
          <h2 className="section-title-vibrant">
            Why{' '}
            <span style={{ color: "var(--saffron)" }}>
              SANYOD
            </span>
            ?
          </h2>
          <p className="section-subtitle-vibrant">
            Discover the colorful advantages of learning with us
          </p>
        </div>
        <div className="row g-4">
          <div className="col-md-6 col-lg-3">
            <div className="feature-card-colorful">
              <div className="feature-icon-colorful feature-icon-saffron">
                <i className="fas fa-video"></i>
              </div>
              <h4>
                Recorded Sessions
              </h4>
              <p className="text-muted">
                Learn at your pace with vibrant video classes
              </p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-card-colorful">
              <div className="feature-icon-colorful feature-icon-turmeric">
                <i className="fas fa-rupee-sign"></i>
              </div>
              <h4>
                Affordable
              </h4>
              <p className="text-muted">
                Quality education that fits every budget
              </p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-card-colorful">
              <div className="feature-icon-colorful feature-icon-emerald">
                <i className="fas fa-book"></i>
              </div>
              <h4>
                Authentic Courses
              </h4>
              <p className="text-muted">
                Traditional knowledge taught authentically
              </p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-card-colorful">
              <div className="feature-icon-colorful feature-icon-sapphire">
                <i className="fab fa-whatsapp"></i>
              </div>
              <h4>
                Community
              </h4>
              <p className="text-muted">
                Active WhatsApp groups for support
              </p>
            </div>
          </div>
        </div>
        <div className="row g-4 mt-4">
          <div className="col-md-6 col-lg-3">
            <div className="feature-card-colorful">
              <div className="feature-icon-colorful feature-icon-lotus">
                <i className="fas fa-clock"></i>
              </div>
              <h4>
                1 Year Access
              </h4>
              <p className="text-muted">
                Learn anytime for a full year
              </p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-card-colorful">
              <div className="feature-icon-colorful feature-icon-sunset">
                <i className="fas fa-file-alt"></i>
              </div>
              <h4>
                {"Notes & Quizzes"}
              </h4>
              <p className="text-muted">
                Comprehensive study materials
              </p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-card-colorful">
              <div className="feature-icon-colorful" style={{ background: "var(--gradient-indigo)" }}>
                <i className="fas fa-certificate"></i>
              </div>
              <h4>
                Certification
              </h4>
              <p className="text-muted">
                Get certified upon completion
              </p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="feature-card-colorful">
              <div className="feature-icon-colorful" style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #FF8A80 100%)" }}>
                <i className="fas fa-comments"></i>
              </div>
              <h4>
                {"Live Q&A"}
              </h4>
              <p className="text-muted">
                Interactive sessions with experts
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TypingVibrant() {
  return (
    <section className="typing-vibrant">
      <div className="container">
        <h2 className="typing-text-vibrant">
          <span className="static-text-vibrant">
            Thousands of{' '}
          </span>
          {' '}
          <span className="changing-text-vibrant" id="typing1"></span>
          {' '}
          <span className="static-text-vibrant">
            {' '}have chosen wisdom!
          </span>
        </h2>
      </div>
    </section>
  );
}

export function StatsVibrant() {
  return (
    <section className="stats-vibrant">
      <div className="container">
        <div className="row">
          <div className="col-md-3 col-6">
            <div className="stat-card-vibrant">
              <div className="stat-icon-vibrant">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-number-vibrant">
                829
                <span style={{ fontSize: "2rem" }}>
                  K+
                </span>
              </div>
              <div className="stat-label" style={{ color: "rgba(255,255,255,0.9)" }}>
                ENROLLED STUDENTS
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stat-card-vibrant">
              <div className="stat-icon-vibrant">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <div className="stat-number-vibrant">
                56
                <span style={{ fontSize: "2rem" }}>
                  K+
                </span>
              </div>
              <div className="stat-label" style={{ color: "rgba(255,255,255,0.9)" }}>
                APP DOWNLOADS
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stat-card-vibrant">
              <div className="stat-icon-vibrant">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-number-vibrant">
                40
                <span style={{ fontSize: "2rem" }}>
                  + hrs
                </span>
              </div>
              <div className="stat-label" style={{ color: "rgba(255,255,255,0.9)" }}>
                CONTENT UPLOADED
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="stat-card-vibrant">
              <div className="stat-icon-vibrant">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-number-vibrant">
                4.9
                <span style={{ fontSize: "2rem" }}>
                  /5
                </span>
              </div>
              <div className="stat-label" style={{ color: "rgba(255,255,255,0.9)" }}>
                AVERAGE RATING
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** "Quick Access" tiles: the whole card navigates, as on live (targets fixed: Courses, Spirituality, A3). */
export function CoursesVibrant({ go }: { go: (to: string) => void }) {
  return (
    <section className="courses-vibrant" style={{ background: "linear-gradient(135deg, rgba(255, 107, 107, 0.05) 0%, rgba(255, 193, 36, 0.05) 100%)" }}>
      <div className="container">
        <div className="section-header-vibrant">
          <h2 className="section-title-vibrant">
            Quick{' '}
            <span style={{ color: "var(--vermillion)" }}>
              Access
            </span>
          </h2>
          <p className="section-subtitle-vibrant">
            Direct access to all our important sections
          </p>
        </div>
        <div className="row g-4 justify-content-center">
          <div className="col-md-3 col-6">
            <div className="course-card-vibrant" onClick={() => go("/programs")}>
              <div className="position-relative">
                <div style={{ height: "200px", background: "var(--gradient-saffron)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <i className="fas fa-chalkboard-teacher" style={{ fontSize: "4rem", color: "white" }}></i>
                </div>
              </div>
              <div className="p-3 text-center">
                <h4 style={{ color: "var(--indigo)", fontWeight: "600" }}>
                  Programs
                </h4>
                <p className="text-muted" style={{ fontSize: "0.9rem", minHeight: "40px" }}>
                  Specialized learning programs and courses
                </p>
                <div className="btn-colorful" style={{ background: "var(--gradient-sunset)", color: "white", width: "100%", padding: "0.8rem", textDecoration: "none", display: "block", borderRadius: "10px", cursor: "pointer" }}>
                  {' '}View Details{' '}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="course-card-vibrant" onClick={() => go("/personality-test")}>
              <div className="position-relative">
                <div style={{ height: "200px", background: "var(--gradient-emerald)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <i className="fas fa-brain" style={{ fontSize: "4rem", color: "white" }}></i>
                </div>
              </div>
              <div className="p-3 text-center">
                <h4 style={{ color: "var(--indigo)", fontWeight: "600" }}>
                  Personality Test
                </h4>
                <p className="text-muted" style={{ fontSize: "0.9rem", minHeight: "40px" }}>
                  Discover your personality type and traits
                </p>
                <div className="btn-colorful" style={{ background: "var(--gradient-sunset)", color: "white", width: "100%", padding: "0.8rem", textDecoration: "none", display: "block", borderRadius: "10px", cursor: "pointer" }}>
                  {' '}Take Test{' '}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="course-card-vibrant" onClick={() => go("/books")}>
              <div className="position-relative">
                <div style={{ height: "200px", background: "var(--gradient-indigo)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <i className="fas fa-book" style={{ fontSize: "4rem", color: "white" }}></i>
                </div>
              </div>
              <div className="p-3 text-center">
                <h4 style={{ color: "var(--indigo)", fontWeight: "600" }}>
                  Books
                </h4>
                <p className="text-muted" style={{ fontSize: "0.9rem", minHeight: "40px" }}>
                  Spiritual and educational books collection
                </p>
                <div className="btn-colorful" style={{ background: "var(--gradient-sunset)", color: "white", width: "100%", padding: "0.8rem", textDecoration: "none", display: "block", borderRadius: "10px", cursor: "pointer" }}>
                  {' '}Explore Books{' '}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="course-card-vibrant" onClick={() => go("/courses")}>
              <div className="position-relative">
                <div style={{ height: "200px", background: "linear-gradient(135deg, #FF4081 0%, #FF8A80 100%)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <i className="fas fa-graduation-cap" style={{ fontSize: "4rem", color: "white" }}></i>
                </div>
              </div>
              <div className="p-3 text-center">
                <h4 style={{ color: "var(--indigo)", fontWeight: "600" }}>
                  Courses
                </h4>
                <p className="text-muted" style={{ fontSize: "0.9rem", minHeight: "40px" }}>
                  Comprehensive learning courses
                </p>
                <div className="btn-colorful" style={{ background: "var(--gradient-sunset)", color: "white", width: "100%", padding: "0.8rem", textDecoration: "none", display: "block", borderRadius: "10px", cursor: "pointer" }}>
                  {' '}Browse Courses{' '}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="course-card-vibrant" onClick={() => go("/spirituality/indian-knowledge")}>
              <div className="position-relative">
                <div style={{ height: "200px", background: "linear-gradient(135deg, #9C27B0 0%, #E040FB 100%)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <i className="fas fa-spa" style={{ fontSize: "4rem", color: "white" }}></i>
                </div>
              </div>
              <div className="p-3 text-center">
                <h4 style={{ color: "var(--indigo)", fontWeight: "600" }}>
                  Spirituality
                </h4>
                <p className="text-muted" style={{ fontSize: "0.9rem", minHeight: "40px" }}>
                  Spiritual guidance and practices
                </p>
                <div className="btn-colorful" style={{ background: "var(--gradient-sunset)", color: "white", width: "100%", padding: "0.8rem", textDecoration: "none", display: "block", borderRadius: "10px", cursor: "pointer" }}>
                  {' '}Explore Spirituality{' '}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="course-card-vibrant" onClick={() => go("/health")}>
              <div className="position-relative">
                <div style={{ height: "200px", background: "linear-gradient(135deg, #FF9800 0%, #FFC107 100%)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <i className="fas fa-heart" style={{ fontSize: "4rem", color: "white" }}></i>
                </div>
              </div>
              <div className="p-3 text-center">
                <h4 style={{ color: "var(--indigo)", fontWeight: "600" }}>
                  Health
                </h4>
                <p className="text-muted" style={{ fontSize: "0.9rem", minHeight: "40px" }}>
                  Support our spiritual mission
                </p>
                <div className="btn-colorful" style={{ background: "var(--gradient-sunset)", color: "white", width: "100%", padding: "0.8rem", textDecoration: "none", display: "block", borderRadius: "10px", cursor: "pointer" }}>
                  {' '}View Details{' '}
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="course-card-vibrant" onClick={() => go("/contact")}>
              <div className="position-relative">
                <div style={{ height: "200px", background: "linear-gradient(135deg, #795548 0%, #A1887F 100%)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <i className="fas fa-phone-alt" style={{ fontSize: "4rem", color: "white" }}></i>
                </div>
              </div>
              <div className="p-3 text-center">
                <h4 style={{ color: "var(--indigo)", fontWeight: "600" }}>
                  Contact
                </h4>
                <p className="text-muted" style={{ fontSize: "0.9rem", minHeight: "40px" }}>
                  Get in touch with us
                </p>
                <div className="btn-colorful" style={{ background: "var(--gradient-sunset)", color: "white", width: "100%", padding: "0.8rem", textDecoration: "none", display: "block", borderRadius: "10px", cursor: "pointer" }}>
                  {' '}Contact Us{' '}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const COURSE_BUTTONS = ['btn-saffron', 'btn-emerald', 'btn-indigo'] as const;

function CourseCardVibrant({ course, badge, index }: { course: CourseSummary; badge: 'new' | 'popular'; index: number }) {
  return (
    <div className="col-md-4">
      <div className="course-card-vibrant" data-course-card="">
        <div className="position-relative">
          <img src={course.image} alt={course.title} className="course-img-vibrant" />{' '}
          <span className={`course-badge-vibrant badge-${badge}`}>{badge === 'new' ? 'NEW' : 'POPULAR'}</span>
        </div>
        <div className="p-3">
          <h4 className="course-title" style={{ color: "var(--indigo)" }}>
            {' '}{course.title.trim()}{' '}
          </h4>
          <p className="text-muted">
            {' '}{previewByBytes(course.description.trim(), 80)}{' '}
          </p>
          {/* Live disabled these links with pointer-events: none (bug); they work here (A3). */}
          <Link to={`/courses/${course.slug}`} className={`btn ${COURSE_BUTTONS[index % 3]} btn-colorful w-100`}>
            {' '}Enroll Now{' '}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** "Courses" section: New Arrivals and Most Popular from GET /api/courses?home=1. */
export function CoursesVibrant2({ courses, loggedIn }: { courses?: HomeCourses; loggedIn: boolean }) {
  return (
    <section className="courses-vibrant">
      <div className="container">
        <div className="section-header-vibrant">
          <h2 className="section-title-vibrant">
            <span style={{ color: "var(--emerald)" }}>
              Courses
            </span>
          </h2>
          <p className="section-subtitle-vibrant">
            Explore our vibrant courses designed for all levels
          </p>
        </div>
        <h3 className="text-center mb-4" style={{ color: "var(--indigo)", fontWeight: "700" }}>
          🎨 New Arrivals
        </h3>
        <div className="row g-4 mb-5">
          {courses?.newArrivals.map((course, i) => <CourseCardVibrant key={course.id} course={course} badge="new" index={i} />)}
        </div>
        <h3 className="text-center mb-4" style={{ color: "var(--saffron)", fontWeight: "700" }}>
          🔥 Most Popular
        </h3>
        <div className="row g-4">
          {courses?.popular.map((course, i) => <CourseCardVibrant key={course.id} course={course} badge="popular" index={i} />)}
        </div>
        <div className="text-center mt-5">
          {/* Live (logged out) shows "Login to View All Courses"; logged-in users go to the catalogue. */}
          <Link to={loggedIn ? '/courses' : '/login'} className="btn-colorful" style={{ background: "var(--gradient-rainbow)", color: "white", padding: "1.2rem 4rem", fontSize: "1.2rem", display: "inline-block", textDecoration: "none", borderRadius: "50px" }}>
            {' '}{loggedIn ? 'View All Courses' : 'Login to View All Courses'}{' '}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function WhyStudyVibrant() {
  return (
    <section className="why-study-vibrant">
      <div className="container">
        <div className="section-header-vibrant">
          <h2 className="section-title-vibrant">
            Why Study in{' '}
            <span style={{ color: "var(--saffron)" }}>
              Sanyod
            </span>
            ?
          </h2>
          <p className="section-subtitle-vibrant">
            learning makes understanding ancient wisdom more engaging
          </p>
        </div>
        <div className="row g-4">
          <div className="col-md-6">
            <div className="why-card-vibrant">
              <div className="why-number-vibrant">
                01
              </div>
              <h4 style={{ color: "var(--saffron)" }}>
                Understand Rituals Deeply
              </h4>
              <p className="text-muted">
                explanations help grasp profound reasons behind Hindu rituals and traditions.
              </p>
              <div className="progress-bar-vibrant mt-3"></div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="why-card-vibrant">
              <div className="why-number-vibrant">
                02
              </div>
              <h4 style={{ color: "var(--emerald)" }}>
                Decode Mythology
              </h4>
              <p className="text-muted">
                Vibrant illustrations uncover hidden meanings in ancient stories.
              </p>
              <div className="progress-bar-vibrant mt-3"></div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="why-card-vibrant">
              <div className="why-number-vibrant">
                03
              </div>
              <h4 style={{ color: "var(--indigo)" }}>
                Identify Misinterpretations
              </h4>
              <p className="text-muted">
                learning helps recognize distorted interpretations easily.
              </p>
              <div className="progress-bar-vibrant mt-3"></div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="why-card-vibrant">
              <div className="why-number-vibrant">
                04
              </div>
              <h4 style={{ color: "var(--sunset-orange)" }}>
                Practical Application
              </h4>
              <p className="text-muted">
                {' '}Examples show how to apply wisdom in daily life.
              </p>
              <div className="progress-bar-vibrant mt-3"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CoursesVibrant3() {
  return (
    <section className="courses-vibrant" style={{ background: "linear-gradient(135deg, rgba(255, 107, 107, 0.05) 0%, rgba(255, 193, 36, 0.05) 100%)" }}>
      <div className="container">
        <div className="section-header-vibrant">
          <h2 className="section-title-vibrant">
            Free{' '}
            <span style={{ color: "var(--vermillion)" }}>
              Masterclasses
            </span>
          </h2>
          <p className="section-subtitle-vibrant">
            Experience our teaching methodology for free
          </p>
        </div>
        <div className="row g-4 justify-content-center">
          <div className="col-md-4">
            <div className="course-card-vibrant">
              <div className="position-relative">
                <div style={{ height: "200px", background: "var(--gradient-saffron)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fas fa-language" style={{ fontSize: "4rem", color: "white" }}></i>
                </div>
                <span className="course-badge-vibrant badge-free">
                  FREE
                </span>
              </div>
              <div className="p-3 text-center">
                <h4 style={{ color: "var(--indigo)" }}>
                  संस्कृत परिचय
                </h4>
                <p className="text-muted">
                  {' '}Introduction to Sanskrit language
                </p>
                <a href="#" className="btn-colorful" style={{ background: "var(--gradient-sunset)", color: "white", width: "100%", padding: "0.8rem", textDecoration: "none", display: "block", borderRadius: "10px" }}>
                  {' '}Join Free Class{' '}
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="course-card-vibrant">
              <div className="position-relative">
                <div style={{ height: "200px", background: "var(--gradient-emerald)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fas fa-book-open" style={{ fontSize: "4rem", color: "white" }}></i>
                </div>
                <span className="course-badge-vibrant badge-free">
                  FREE
                </span>
              </div>
              <div className="p-3 text-center">
                <h4 style={{ color: "var(--indigo)" }}>
                  गीता प्रथम अध्याय
                </h4>
                <p className="text-muted">
                  Vibrant discussion of Bhagavad Gita
                </p>
                <a href="#" className="btn-colorful" style={{ background: "var(--gradient-sunset)", color: "white", width: "100%", padding: "0.8rem", textDecoration: "none", display: "block", borderRadius: "10px" }}>
                  {' '}Join Free Class{' '}
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="course-card-vibrant">
              <div className="position-relative">
                <div style={{ height: "200px", background: "var(--gradient-indigo)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fas fa-spa" style={{ fontSize: "4rem", color: "white" }}></i>
                </div>
                <span className="course-badge-vibrant badge-free">
                  FREE
                </span>
              </div>
              <div className="p-3 text-center">
                <h4 style={{ color: "var(--indigo)" }}>
                  योग सूत्र संवाद
                </h4>
                <p className="text-muted">
                  {' '}Exploration of Yoga Sutras
                </p>
                <a href="#" className="btn-colorful" style={{ background: "var(--gradient-sunset)", color: "white", width: "100%", padding: "0.8rem", textDecoration: "none", display: "block", borderRadius: "10px" }}>
                  {' '}Join Free Class{' '}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TypingVibrant2() {
  return (
    <section className="typing-vibrant" style={{ background: "linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(139, 0, 139, 0.1) 100%)" }}>
      <div className="container">
        <h2 className="typing-text-vibrant">
          <span className="changing-text-vibrant" id="typing2"></span>
          {' '}
          <span className="static-text-vibrant">
            {' '}students learn with SANYOD!
          </span>
        </h2>
      </div>
    </section>
  );
}

export function FeaturesVibrant2() {
  return (
    <section className="features-vibrant">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="ratio ratio-16x9" style={{ borderRadius: "var(--border-radius-large)", overflow: "hidden", boxShadow: "var(--shadow-vibrant)", border: "5px solid white" }}>
              <video autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }}>
                <source src="/images/videos/video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface HomeContentProps {
  go: (to: string) => void;
  courses?: HomeCourses;
  loggedIn: boolean;
}

export default function HomeContent({ go, courses, loggedIn }: HomeContentProps) {
  return (
    <>
      <AnimatedBg />
      <AnimatedBgOverlay />
      <ColorParticles />
      <Block1 />
      <Block2 />
      <SanskritDecoration />
      <SanskritDecoration2 />
      <HeroVibrant />
      <FeaturesVibrant />
      <CategoriesVibrant />
      <TypingVibrant />
      <StatsVibrant />
      <CoursesVibrant go={go} />
      <CoursesVibrant2 courses={courses} loggedIn={loggedIn} />
      <WhyStudyVibrant />
      <CoursesVibrant3 />
      <TypingVibrant2 />
      <FeaturesVibrant2 />
    </>
  );
}
