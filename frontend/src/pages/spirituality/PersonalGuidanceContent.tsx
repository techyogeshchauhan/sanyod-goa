// Generated from reference/live-html/presonal.html by scripts/html-to-jsx.mjs, then edited by hand.
// Markup, classes and texts match the live page; styles: src/styles/pages/personal-guidance.page.css
// Edited: booking buttons open the "Book Your Free Consultation" modal (allowed adjustment A2).
import type { MouseEvent } from 'react';
import type { BookingRequest } from './GuidanceConsultationModal';

type BookHandler = (request: BookingRequest) => (e: MouseEvent<HTMLAnchorElement>) => void;

export function Main({ book }: { book: BookHandler }) {
  return (
    <main>
      <div className="guidance-bg"></div>
      <div className="guidance-pattern"></div>
      <div className="floating-om" style={{ top: "15%", left: "10%" }}>
        ॐ
      </div>
      <div className="floating-om" style={{ top: "25%", right: "15%" }}>
        गुरु
      </div>
      <div className="floating-om" style={{ bottom: "35%", left: "20%" }}>
        ज्ञान
      </div>
      <div className="floating-path" style={{ top: "40%", right: "5%" }}></div>
      <div className="floating-path" style={{ bottom: "20%", left: "10%" }}></div>
      <section className="guidance-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center">
              <div className="sanskrit-guidance">
                गुरुकृपा हि केवलम्
              </div>
              <h1 className="hero-title-guidance">
                {' '}Personal Guidance{' '}
              </h1>
              <p className="hero-subtitle-guidance">
                {' '}Receive personalized spiritual guidance from experienced mentors. Transform your spiritual journey with one-on-one mentorship tailored to your unique path and aspirations.{' '}
              </p>
              <div className="hero-buttons mt-4">
                <a href="#mentors" className="btn-guidance me-3 mb-3">
                  <i className="fas fa-user-tie me-2"></i>
                  Meet Our Mentors{' '}
                </a>
                {' '}
                <a href="#process" className="btn-guidance-light mb-3">
                  <i className="fas fa-calendar-check me-2"></i>
                  Book Consultation{' '}
                </a>
              </div>
              <div className="mt-5">
                <div className="progress-path"></div>
                <p className="text-muted">
                  <i className="fas fa-quote-left me-2 text-saffron"></i>
                  {' '}"When the student is ready, the teacher appears"{' '}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mentorship-path">
        <div className="container">
          <div className="section-header-guidance">
            <div className="sanskrit-guidance">
              मार्गदर्शन मार्ग
            </div>
            <h2 className="section-title-guidance">
              Your Spiritual{' '}
              <span style={{ color: "var(--guidance-saffron)" }}>
                Guidance Path
              </span>
            </h2>
            <p className="section-subtitle-guidance">
              Discover how personalized guidance can accelerate your spiritual growth
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="path-card-guidance">
                <div className="path-icon-guidance">
                  <i className="fas fa-search"></i>
                </div>
                <h4 className="text-deep mb-3">
                  Self-Assessment
                </h4>
                <p className="text-muted">
                  Understand your current spiritual state and identify growth areas
                </p>
                <div className="progress-path mt-3"></div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="path-card-guidance">
                <div className="path-icon-guidance">
                  <i className="fas fa-user-tie"></i>
                </div>
                <h4 className="text-deep mb-3">
                  Mentor Matching
                </h4>
                <p className="text-muted">
                  Connect with the perfect mentor for your spiritual journey
                </p>
                <div className="progress-path mt-3"></div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="path-card-guidance">
                <div className="path-icon-guidance">
                  <i className="fas fa-road"></i>
                </div>
                <h4 className="text-deep mb-3">
                  Personalized Plan
                </h4>
                <p className="text-muted">
                  Receive a customized spiritual practice plan
                </p>
                <div className="progress-path mt-3"></div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="path-card-guidance">
                <div className="path-icon-guidance">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h4 className="text-deep mb-3">
                  Ongoing Support
                </h4>
                <p className="text-muted">
                  Regular check-ins and guidance adjustments
                </p>
                <div className="progress-path mt-3"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mentors-section" id="mentors">
        <div className="container">
          <div className="section-header-guidance">
            <div className="sanskrit-guidance">
              गुरुवर्याः
            </div>
            <h2 className="section-title-guidance">
              Meet Our{' '}
              <span style={{ color: "var(--guidance-indigo)" }}>
                Spiritual Mentors
              </span>
            </h2>
            <p className="section-subtitle-guidance">
              Learn from experienced guides who have walked the path themselves
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="mentor-card-guidance">
                <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" className="mentor-img-guidance" alt="Swami Devanand" />
                <div className="mentor-overlay-guidance">
                  <span className="mentor-badge-guidance">
                    {"Vedanta & Meditation"}
                  </span>
                  <h4 className="text-white mb-1">
                    Swami Devanand
                  </h4>
                  <p className="text-light mb-0">
                    25+ years in spiritual guidance
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-muted mb-3">
                    Specializes in Advaita Vedanta, meditation techniques, and spiritual counseling for modern life.
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="fas fa-star text-warning me-1"></i>
                      {' '}
                      <span className="text-muted">
                        4.9 (124 reviews)
                      </span>
                    </div>
                    <a href="#" onClick={book({ mentor: 'swami' })} className="btn-guidance btn-sm">
                      Book Session
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="mentor-card-guidance">
                <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" className="mentor-img-guidance" alt="Dr. Priya Sharma" />
                <div className="mentor-overlay-guidance">
                  <span className="mentor-badge-guidance" style={{ background: "var(--gradient-guidance)" }}>
                    {"Yoga & Ayurveda"}
                  </span>
                  <h4 className="text-white mb-1">
                    Dr. Priya Sharma
                  </h4>
                  <p className="text-light mb-0">
                    PhD in Yoga Psychology
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-muted mb-3">
                    Expert in therapeutic yoga, pranayama, and Ayurvedic lifestyle guidance.
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="fas fa-star text-warning me-1"></i>
                      {' '}
                      <span className="text-muted">
                        4.8 (98 reviews)
                      </span>
                    </div>
                    <a href="#" onClick={book({ mentor: 'priya' })} className="btn-guidance btn-sm">
                      Book Session
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="mentor-card-guidance">
                <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" className="mentor-img-guidance" alt="Acharya Rajan" />
                <div className="mentor-overlay-guidance">
                  <span className="mentor-badge-guidance" style={{ background: "linear-gradient(135deg, #228B22 0%, #8B4513 100%)" }}>
                    {"Scripture & Rituals"}
                  </span>
                  <h4 className="text-white mb-1">
                    Acharya Rajan
                  </h4>
                  <p className="text-light mb-0">
                    {"Vedic Scholar & Ritual Expert"}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-muted mb-3">
                    Deep knowledge of scriptures, rituals, and practical spirituality for daily life.
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="fas fa-star text-warning me-1"></i>
                      {' '}
                      <span className="text-muted">
                        4.9 (156 reviews)
                      </span>
                    </div>
                    <a href="#" onClick={book({ mentor: 'rajan' })} className="btn-guidance btn-sm">
                      Book Session
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-5">
            <a href="#" className="btn-guidance-light">
              <i className="fas fa-users me-2"></i>
              View All Mentors{' '}
            </a>
          </div>
        </div>
      </section>
      <section className="process-section" id="process">
        <div className="container">
          <div className="section-header-guidance">
            <div className="sanskrit-guidance">
              प्रक्रिया
            </div>
            <h2 className="section-title-guidance">
              How{' '}
              <span style={{ color: "var(--guidance-growth)" }}>
                Personal Guidance
              </span>
              {' '}Works
            </h2>
            <p className="section-subtitle-guidance">
              A structured approach to your spiritual development
            </p>
          </div>
          <div className="row">
            <div className="col-lg-10 mx-auto">
              <div className="process-step-guidance">
                <div className="step-number">
                  01
                </div>
                <h3 className="text-deep mb-3">
                  Initial Assessment Session
                </h3>
                <p className="text-muted mb-3">
                  A comprehensive 60-minute session where we understand your spiritual background, current practices, challenges, and aspirations. This helps us create a personalized spiritual profile.
                </p>
                <div className="progress-path"></div>
              </div>
              <div className="process-step-guidance">
                <div className="step-number">
                  02
                </div>
                <h3 className="text-deep mb-3">
                  Customized Practice Plan
                </h3>
                <p className="text-muted mb-3">
                  Based on your assessment, we create a personalized spiritual practice plan that includes meditation techniques, study materials, rituals, and lifestyle adjustments specifically tailored for you.
                </p>
                <div className="progress-path"></div>
              </div>
              <div className="process-step-guidance">
                <div className="step-number">
                  03
                </div>
                <h3 className="text-deep mb-3">
                  Regular Guidance Sessions
                </h3>
                <p className="text-muted mb-3">
                  Weekly or bi-weekly one-on-one sessions with your mentor to discuss progress, address challenges, deepen understanding, and adjust practices as needed.
                </p>
                <div className="progress-path"></div>
              </div>
              <div className="process-step-guidance">
                <div className="step-number">
                  04
                </div>
                <h3 className="text-deep mb-3">
                  {"Ongoing Support & Community"}
                </h3>
                <p className="text-muted mb-3">
                  Access to our spiritual community, regular check-ins, email support, and resources to ensure continuous growth and support throughout your journey.
                </p>
                <div className="progress-path"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="sessions-section">
        <div className="container">
          <div className="section-header-guidance">
            <div className="sanskrit-guidance">
              व्यक्तिगत सत्र
            </div>
            <h2 className="section-title-guidance">
              Personal{' '}
              <span style={{ color: "var(--guidance-peace)" }}>
                Guidance Sessions
              </span>
            </h2>
            <p className="section-subtitle-guidance">
              Choose the guidance format that works best for you
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="session-card-guidance">
                <div className="session-icon">
                  <i className="fas fa-video"></i>
                </div>
                <span className="session-badge">
                  Most Popular
                </span>
                <h4 className="text-deep mb-3">
                  One-on-One Video Sessions
                </h4>
                <p className="text-muted mb-3">
                  Private video sessions with your chosen mentor for personalized guidance
                </p>
                <div className="my-4">
                  <h2 className="text-saffron">
                    ₹999
                    <span className="text-muted" style={{ fontSize: "1rem" }}>
                      /session
                    </span>
                  </h2>
                </div>
                <a href="#" onClick={book({ plan: 'one-on-one' })} className="btn-guidance w-100">
                  Book Now
                </a>
              </div>
            </div>
            <div className="col-md-4">
              <div className="session-card-guidance">
                <div className="session-icon">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <span className="session-badge" style={{ background: "var(--gradient-mentor)" }}>
                  Monthly Plan
                </span>
                <h4 className="text-deep mb-3">
                  Monthly Mentorship
                </h4>
                <p className="text-muted mb-3">
                  4 sessions per month with ongoing support and practice plans
                </p>
                <div className="my-4">
                  <h2 className="text-indigo">
                    ₹3,499
                    <span className="text-muted" style={{ fontSize: "1rem" }}>
                      /month
                    </span>
                  </h2>
                  <p className="text-muted small">
                    Save ₹497
                  </p>
                </div>
                <a href="#" onClick={book({ plan: 'monthly' })} className="btn-guidance w-100" style={{ background: "var(--gradient-mentor)" }}>
                  Subscribe
                </a>
              </div>
            </div>
            <div className="col-md-4">
              <div className="session-card-guidance">
                <div className="session-icon">
                  <i className="fas fa-users"></i>
                </div>
                <span className="session-badge" style={{ background: "var(--gradient-guidance)" }}>
                  Group Session
                </span>
                <h4 className="text-deep mb-3">
                  Group Guidance
                </h4>
                <p className="text-muted mb-3">
                  Small group sessions (max 5 people) for shared learning and support
                </p>
                <div className="my-4">
                  <h2 className="text-growth">
                    ₹499
                    <span className="text-muted" style={{ fontSize: "1rem" }}>
                      /session
                    </span>
                  </h2>
                </div>
                <a href="#" onClick={book({ plan: 'group' })} className="btn-guidance w-100" style={{ background: "var(--gradient-guidance)" }}>
                  Join Group
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="testimonial-guidance">
        <div className="container">
          <div className="section-header-guidance">
            <div className="sanskrit-guidance">
              शिष्य अनुभव
            </div>
            <h2 className="section-title-guidance">
              Transformative{' '}
              <span style={{ color: "var(--guidance-saffron)" }}>
                Experiences
              </span>
            </h2>
            <p className="section-subtitle-guidance">
              Hear from those who have walked this path with guidance
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="testimonial-card-guidance">
                <h4 className="text-deep mb-3">
                  "Swami Devanand's guidance transformed my meditation practice from struggle to joy. I've found peace I never knew was possible."
                </h4>
                <div className="d-flex align-items-center mt-4">
                  <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" className="rounded-circle me-3" width="60" height="60" alt="Student" />
                  <div>
                    <h5 className="mb-1">
                      Rahul Mehta
                    </h5>
                    <p className="text-muted mb-0">
                      6 months of mentorship
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="testimonial-card-guidance">
                <h4 className="text-deep mb-3">
                  "The personalized yoga plan from Dr. Priya helped me overcome chronic back pain and find spiritual connection through movement."
                </h4>
                <div className="d-flex align-items-center mt-4">
                  <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" className="rounded-circle me-3" width="60" height="60" alt="Student" />
                  <div>
                    <h5 className="mb-1">
                      Anjali Singh
                    </h5>
                    <p className="text-muted mb-0">
                      4 months of guidance
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="testimonial-card-guidance">
                <h4 className="text-deep mb-3">
                  "Acharya Rajan's explanations of rituals gave them deep meaning. My daily practice has become truly transformative."
                </h4>
                <div className="d-flex align-items-center mt-4">
                  <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" className="rounded-circle me-3" width="60" height="60" alt="Student" />
                  <div>
                    <h5 className="mb-1">
                      Vikram Joshi
                    </h5>
                    <p className="text-muted mb-0">
                      8 months of mentorship
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="testimonial-card-guidance">
                <h4 className="text-deep mb-3">
                  "The monthly mentorship plan gave me consistency. My spiritual practice is now a non-negotiable part of my life."
                </h4>
                <div className="d-flex align-items-center mt-4">
                  <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" className="rounded-circle me-3" width="60" height="60" alt="Student" />
                  <div>
                    <h5 className="mb-1">
                      Priya Desai
                    </h5>
                    <p className="text-muted mb-0">
                      1 year of guidance
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="faq-section">
        <div className="container">
          <div className="section-header-guidance">
            <div className="sanskrit-guidance">
              प्रश्नोत्तर
            </div>
            <h2 className="section-title-guidance">
              Frequently Asked{' '}
              <span style={{ color: "var(--guidance-gold)" }}>
                Questions
              </span>
            </h2>
            <p className="section-subtitle-guidance">
              Get answers to common questions about personal spiritual guidance
            </p>
          </div>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="faq-card-guidance">
                <h4 className="text-deep mb-3">
                  <i className="fas fa-question-circle me-2 text-saffron"></i>
                  {' '}How do I choose the right mentor for me?{' '}
                </h4>
                <p className="text-muted mb-0">
                  We provide detailed mentor profiles, introductory videos, and offer a complimentary 15-minute consultation call to help you find the perfect match for your spiritual journey.
                </p>
              </div>
              <div className="faq-card-guidance">
                <h4 className="text-deep mb-3">
                  <i className="fas fa-question-circle me-2 text-indigo"></i>
                  {' '}What if I need to change mentors?{' '}
                </h4>
                <p className="text-muted mb-0">
                  We understand that spiritual needs evolve. You can request a mentor change at any time, and we'll help you transition smoothly to a better-matched guide.
                </p>
              </div>
              <div className="faq-card-guidance">
                <h4 className="text-deep mb-3">
                  <i className="fas fa-question-circle me-2 text-growth"></i>
                  {' '}How often should I have guidance sessions?{' '}
                </h4>
                <p className="text-muted mb-0">
                  Most students benefit from weekly or bi-weekly sessions initially, then transition to monthly check-ins as their practice becomes established. We'll recommend a frequency based on your assessment.
                </p>
              </div>
              <div className="faq-card-guidance">
                <h4 className="text-deep mb-3">
                  <i className="fas fa-question-circle me-2 text-peace"></i>
                  {' '}Is the guidance suitable for beginners?{' '}
                </h4>
                <p className="text-muted mb-0">
                  Absolutely! Our mentors are experienced in guiding complete beginners. We start exactly where you are and progress at your comfortable pace.
                </p>
              </div>
              <div className="faq-card-guidance">
                <h4 className="text-deep mb-3">
                  <i className="fas fa-question-circle me-2 text-gold"></i>
                  {' '}What happens between sessions?{' '}
                </h4>
                <p className="text-muted mb-0">
                  You'll receive personalized practices to work on, access to our resource library, and can email your mentor with questions that arise between sessions.
                </p>
              </div>
            </div>
          </div>
          <div className="text-center mt-5">
            <a href="#" className="btn-guidance">
              <i className="fas fa-comment-alt me-2"></i>
              Ask Your Question{' '}
            </a>
          </div>
        </div>
      </section>
      <section className="process-section">
        <div className="container">
          <div className="row justify-content-center align-items-center">
            <div className="col-lg-8 text-center">
              <div className="sanskrit-guidance mb-4">
                गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः
              </div>
              <h2 className="text-deep mb-4">
                Begin Your Guided Spiritual Journey Today
              </h2>
              <p className="text-muted mb-4">
                {' '}Take the first step towards transformative spiritual growth with personalized guidance from experienced mentors who understand your unique path.{' '}
              </p>
              <div className="hero-buttons">
                <a href="#" onClick={book({})} className="btn-guidance me-3">
                  <i className="fas fa-calendar-plus me-2"></i>
                  Book Free Consultation{' '}
                </a>
                {' '}
                <a href="#" className="btn-guidance-light">
                  <i className="fas fa-play-circle me-2"></i>
                  Watch Success Stories{' '}
                </a>
              </div>
              <div className="row mt-5 justify-content-center">
                <div className="col-auto">
                  <div className="text-center">
                    <h3 className="text-saffron">
                      500+
                    </h3>
                    <p className="text-muted">
                      Students Guided
                    </p>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="text-center">
                    <h3 className="text-indigo">
                      4.8/5
                    </h3>
                    <p className="text-muted">
                      Average Rating
                    </p>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="text-center">
                    <h3 className="text-growth">
                      96%
                    </h3>
                    <p className="text-muted">
                      Satisfaction Rate
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

export default function PersonalGuidanceContent({ book }: { book: BookHandler }) {
  return (
    <>
      <Main book={book} />
    </>
  );
}
