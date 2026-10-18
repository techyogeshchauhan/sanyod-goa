// Generated from reference/live-html/Personality_Test.html by scripts/html-to-jsx.mjs, then edited by hand.
// Markup, classes and texts match the live page; styles: src/styles/pages/personality-test.page.css

export function PrakritiTestContainer() {
  return (
    <div className="prakriti-test-container">
      <div className="language-switcher">
        <button className="lang-btn active" id="hindiBtn">
          हिंदी
        </button>
        {' '}
        <button className="lang-btn" id="englishBtn">
          English
        </button>
      </div>
      <div className="test-tabs">
        <button className="test-tab active" id="physicalTab">
          Physical Test
        </button>
        {' '}
        <button className="test-tab" id="emotionsTab">
          Emotions Test
        </button>
        {' '}
        <button className="test-tab" id="kundliTab">
          Karma Situation
        </button>
      </div>
      <div className="header-image" id="headerImage">
        <h2 id="headerImageText">
          शारीरिक प्रकृति परीक्षण
        </h2>
      </div>
      <div className="test-header">
        <h1 id="testTitle">
          प्रकृति परीक्षण
        </h1>
        <p id="testDescription">
          नीचे दिए गए प्रश्नों के उत्तर दें और अपनी प्रकृति (वात, पित्त, कफ) जानें
        </p>
      </div>
      <div className="progress-container">
        <div className="progress-bar" id="progressBar"></div>
      </div>
      <div id="questionCounter" className="question-counter">
        <span id="currentQuestion">
          1
        </span>
        {' '}/{' '}
        <span id="totalQuestions">
          21
        </span>
      </div>
      <form id="quizForm"></form>
      <div className="navigation-buttons">
        <button className="nav-btn prev-btn" id="prevBtn" disabled>
          <span id="prevText">
            पिछला
          </span>
        </button>
        {' '}
        <button className="nav-btn next-btn" id="nextBtn">
          <span id="nextText">
            अगला
          </span>
        </button>
        {' '}
        <button className="nav-btn submit-btn" id="submitBtn">
          <span id="submitText">
            परिणाम देखें
          </span>
        </button>
      </div>
      <div className="kundli-container" id="kundliContainer">
        <form id="kundliForm" className="kundli-form">
          <div className="form-group">
            <label htmlFor="name" id="nameLabel">
              नाम:
            </label>
            {' '}
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-group">
            <label htmlFor="dob" id="dobLabel">
              जन्म तिथि (DD/MM/YYYY):
            </label>
            {' '}
            <input type="text" id="dob" name="dob" placeholder="DD/MM/YYYY" required />
          </div>
          <div className="form-group">
            <label htmlFor="time" id="timeLabel">
              जन्म समय (HH:MM):
            </label>
            {' '}
            <input type="text" id="time" name="time" placeholder="HH:MM" required />
          </div>
          <div className="form-group">
            <label htmlFor="place" id="placeLabel">
              जन्म स्थान:
            </label>
            {' '}
            <input type="text" id="place" name="place" required />
          </div>
          <button type="submit" className="kundli-submit-btn" id="kundliSubmitBtn">
            कुंडली बनाएँ
          </button>
        </form>
        <div id="kundliOutput" className="kundli-output"></div>
      </div>
      <div className="result-container" id="resultContainer">
        <h2 className="result-header" id="resultHeader">
          आपका परिणाम
        </h2>
        <div className="guna-result" id="gunaResult"></div>
        <div className="guna-scores">
          <div className="guna-score sattva-score">
            <div className="guna-name sattva-name" id="sattvaText">
              सत्व
            </div>
            <div className="guna-value sattva-value" id="sattvaScore">
              0
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill sattva-bar" id="sattvaBar"></div>
            </div>
            <div className="percentage-value" id="sattvaPercentage">
              0%
            </div>
          </div>
          <div className="guna-score rajas-score">
            <div className="guna-name rajas-name" id="rajasText">
              रजस्
            </div>
            <div className="guna-value rajas-value" id="rajasScore">
              0
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill rajas-bar" id="rajasBar"></div>
            </div>
            <div className="percentage-value" id="rajasPercentage">
              0%
            </div>
          </div>
          <div className="guna-score tamas-score">
            <div className="guna-name tamas-name" id="tamasText">
              तमस्
            </div>
            <div className="guna-value tamas-value" id="tamasScore">
              0
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill tamas-bar" id="tamasBar"></div>
            </div>
            <div className="percentage-value" id="tamasPercentage">
              0%
            </div>
          </div>
        </div>
        <div className="guna-description" id="gunaDescription"></div>
        <div className="suggestions-container" id="suggestionsContainer">
          <h3 className="suggestions-title" id="suggestionsTitle">
            आपके लिए सुझाव
          </h3>
          <div id="suggestionsContent"></div>
        </div>
      </div>
    </div>
  );
}

export default function PersonalityTestContent() {
  return (
    <>
      <PrakritiTestContainer />
    </>
  );
}
