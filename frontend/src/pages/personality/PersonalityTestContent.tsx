// Markup of the Prakriti / Guna test in the SANYOD design system (D-27). The quiz itself is driven
// by personalityTest.legacy.ts, which finds its elements by id and toggles these classes:
// .active (language/test buttons), .progress-container, .question-counter, .navigation-buttons,
// and renders .question-container/.option-item, .suggestion-category and the kundli output.
// Keep every id and those class names. Styles: src/styles/pages/personality-test.page.css
import { Link } from 'react-router-dom';

function TestHero() {
  return (
    <section className="page-hero compact">
      <div className="container position-relative" style={{ zIndex: 1 }}>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>Personality Test</span>
        </nav>
        <div className="eyebrow-deva">प्रकृति · गुण · कर्म</div>
        <h1 id="testTitle" className="deva">
          प्रकृति परीक्षण
        </h1>
        <p id="testDescription" className="lead deva">
          नीचे दिए गए प्रश्नों के उत्तर दें और अपनी प्रकृति (वात, पित्त, कफ) जानें
        </p>
      </div>
    </section>
  );
}

function Toolbar() {
  return (
    <div className="pt-toolbar">
      <div className="segmented test-tabs" role="group" aria-label="Test">
        <button type="button" className="test-tab active" id="physicalTab">
          <i className="fas fa-heartbeat"></i> Physical Test
        </button>
        <button type="button" className="test-tab" id="emotionsTab">
          <i className="fas fa-brain"></i> Emotions Test
        </button>
        <button type="button" className="test-tab" id="kundliTab">
          <i className="fas fa-star-and-crescent"></i> Karma Situation
        </button>
      </div>
      <div className="segmented language-switcher" role="group" aria-label="Language">
        <button type="button" className="lang-btn active deva" id="hindiBtn">
          हिंदी
        </button>
        <button type="button" className="lang-btn" id="englishBtn">
          English
        </button>
      </div>
    </div>
  );
}

function Quiz() {
  return (
    <>
      <div className="progress-container" aria-hidden="true">
        <div className="progress-bar" id="progressBar"></div>
      </div>
      <div id="questionCounter" className="question-counter">
        <span id="currentQuestion">1</span> / <span id="totalQuestions">21</span>
      </div>
      <form id="quizForm"></form>
      <div className="navigation-buttons">
        <button type="button" className="btn btn-light nav-btn prev-btn" id="prevBtn" disabled>
          <i className="fas fa-arrow-left"></i> <span id="prevText">पिछला</span>
        </button>
        <button type="button" className="btn btn-primary nav-btn next-btn" id="nextBtn">
          <span id="nextText">अगला</span> <i className="fas fa-arrow-right"></i>
        </button>
        <button type="button" className="btn btn-success nav-btn submit-btn" id="submitBtn">
          <i className="fas fa-check"></i> <span id="submitText">परिणाम देखें</span>
        </button>
      </div>
    </>
  );
}

function Kundli() {
  return (
    <div className="kundli-container" id="kundliContainer">
      <form id="kundliForm" className="kundli-form">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="name" id="nameLabel">
              नाम:
            </label>
            <input type="text" className="form-control" id="name" name="name" required />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="place" id="placeLabel">
              जन्म स्थान:
            </label>
            <input type="text" className="form-control" id="place" name="place" required />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="dob" id="dobLabel">
              जन्म तिथि (DD/MM/YYYY):
            </label>
            <input type="text" className="form-control" id="dob" name="dob" placeholder="DD/MM/YYYY" inputMode="numeric" required />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="time" id="timeLabel">
              जन्म समय (HH:MM):
            </label>
            <input type="text" className="form-control" id="time" name="time" placeholder="HH:MM" inputMode="numeric" required />
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary btn-lg w-100 kundli-submit-btn" id="kundliSubmitBtn">
              कुंडली बनाएँ
            </button>
          </div>
        </div>
      </form>
      <div id="kundliOutput" className="kundli-output"></div>
    </div>
  );
}

function GunaScore({ guna, label }: { guna: 'sattva' | 'rajas' | 'tamas'; label: string }) {
  return (
    <div className={`guna-score ${guna}-score`}>
      <div className={`guna-name ${guna}-name`} id={`${guna}Text`}>
        {label}
      </div>
      <div className={`guna-value ${guna}-value`} id={`${guna}Score`}>
        0
      </div>
      <div className="progress-bar-container">
        <div className={`progress-bar-fill ${guna}-bar`} id={`${guna}Bar`}></div>
      </div>
      <div className="percentage-value" id={`${guna}Percentage`}>
        0%
      </div>
    </div>
  );
}

function Result() {
  return (
    <div className="result-container" id="resultContainer">
      <div className="text-center">
        <div className="eyebrow">Result</div>
        <h2 className="result-header" id="resultHeader">
          आपका परिणाम
        </h2>
        <div className="guna-result" id="gunaResult"></div>
      </div>
      <div className="guna-scores">
        <GunaScore guna="sattva" label="सत्व" />
        <GunaScore guna="rajas" label="रजस्" />
        <GunaScore guna="tamas" label="तमस्" />
      </div>
      <div className="guna-description" id="gunaDescription"></div>
      <div className="suggestions-container" id="suggestionsContainer">
        <h3 className="suggestions-title h4" id="suggestionsTitle">
          आपके लिए सुझाव
        </h3>
        <div id="suggestionsContent"></div>
      </div>
      <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
        <Link to="/spirituality/personal-guidance" className="btn btn-primary">
          <i className="fas fa-user-friends"></i> Get personal guidance
        </Link>
        <Link to="/courses" className="btn btn-light">
          <i className="fas fa-play-circle"></i> Explore courses
        </Link>
      </div>
    </div>
  );
}

export default function PersonalityTestContent() {
  return (
    <>
      <TestHero />
      <section className="section">
        <div className="container container-narrow">
          <Toolbar />
          <div className="card-flat prakriti-test-container">
            <div className="header-image" id="headerImage">
              <h2 id="headerImageText" className="deva">
                शारीरिक प्रकृति परीक्षण
              </h2>
            </div>
            <Quiz />
            <Kundli />
            <Result />
          </div>
          <p className="small text-muted text-center mt-4 mb-0">
            <i className="fas fa-info-circle me-1"></i>
            This self-assessment runs in your browser; your answers are not stored.
          </p>
        </div>
      </section>
    </>
  );
}
