import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CtaBand, FitImage, PageHero } from '@/components/ui';

// about.php content (Hindi, unchanged) in alternating image/text sections.
const BLOCKS: { title: string; image: string; icon: string; body: ReactNode }[] = [
  {
    title: 'SanYod',
    image: '/images/SanYod.jpg',
    icon: 'fas fa-om',
    body: (
      <>
        <p>
          <strong>San - sankhya (सांख्य), Yo - Yog (योग), d - darshan (दर्शन)</strong>
        </p>
        <p>
          साधक जामवंत, सांख्य योग दर्शन के गहन अध्येता और जीवन के समग्र विकास के लिए समर्पित एक मार्गदर्शक हैं। इनकी यात्रा सांख्य और योग के प्राचीन भारतीय दर्शन से
          शुरू हुई, जो जीवन को वैज्ञानिक, आध्यात्मिक, शारीरिक और मानसिक स्वास्थ्य के दृष्टिकोण से समझने का एक अनूठा मार्ग प्रदान करते हैं।
        </p>
        <p>इनके इस प्रयास, SanYod, का उद्देश्य इन दार्शनिक सिद्धांतों को आधुनिक जीवनशैली के साथ जोड़कर आपके समग्र कल्याण को सशक्त बनाना है।</p>
      </>
    ),
  },
  {
    title: 'सांख्य और योग दर्शन',
    image: '/images/IMG-20250921-WA0003.jpg',
    icon: 'fas fa-yin-yang',
    body: (
      <>
        <p>विश्व के सबसे प्राचीन दर्शन भारतीय ऋषियों के दर्शन को माना जाता हैं। तथा भारतीय ऋषियों के दर्शन में भी सबसे प्राचीन या प्रारंभिक दर्शन सांख्य योग दर्शन कहलाता हैं।</p>
        <p>
          सांख्य दर्शन, जो प्रकृति और पुरुष के द्वैत को समझाता है, हमें जीवन के मूलभूत सत्य को जानने की दृष्टि देता है। यह बताता है कि हमारा विश्व पंचमहाभूत—पृथ्वी
          (पृथ्वी), जल (आप), अग्नि (तेज), वायु (वायु), और आकाश (ख) से निर्मित है।
        </p>
      </>
    ),
  },
  {
    title: 'SanYod का विजन',
    image: '/images/IMG-20250921-WA0004.jpg',
    icon: 'fas fa-mountain',
    body: (
      <>
        <p>SanYod इस विश्वास का प्रतीक है कि प्राचीन दर्शन और आधुनिक विज्ञान का समन्वय जीवन को संपूर्णता प्रदान कर सकता है।</p>
        <p>इस मंच के माध्यम से, आपको सांख्य और योग के सिद्धांतों पर आधारित ऑनलाइन कोर्स, आध्यात्मिक रिट्रीट प्रोग्राम, पुस्तक और मनोवैज्ञानिक परामर्श प्रदान करता हैं।</p>
        <blockquote className="about-quote">
          चाहे आप विज्ञान की संतुलित समझ, तनाव से मुक्ति, भावनात्मक संतुलन, शारीरिक स्वास्थ्य, या आध्यात्मिक जागरूकता की खोज में हों, SanYod आपके लिए एक मार्गदर्शक
          बनकर साथ देगा।
        </blockquote>
      </>
    ),
  },
  {
    title: 'पंचमहाभूत और अंतःकरण का महत्व',
    image: '/images/IMG-20250921-WA0002.jpg',
    icon: 'fas fa-seedling',
    body: (
      <>
        <p>
          <span className="me-2">🌎</span>
          <strong>पंचमहाभूत:</strong> ये पांच तत्व हमारे शरीर, मन, और पर्यावरण का आधार हैं। उदाहरण के लिए, पृथ्वी तत्व स्थिरता और संरचना प्रदान करता है, जल तत्व
          प्रवाह और पोषण, अग्नि तत्व ऊर्जा और परिवर्तन, वायु तत्व गति और श्वास, और आकाश तत्व चेतना और विस्तार का प्रतीक है।
        </p>
        <p>
          <span className="me-2">🧠</span>
          <strong>अंतःकरण:</strong> हमारा मन, बुद्धि, चित्त, और अहंकार मिलकर हमारी आंतरिक दुनिया को संचालित करते हैं। सांख्य दर्शन के अनुसार, अंतःकरण को समझना और
          संतुलित करना आत्म-जागरूकता और शांति की कुंजी है।
        </p>
      </>
    ),
  },
  {
    title: 'SanYod के माध्यम से',
    image: '/img/WhatsApp-Image-2025-11-01-at-20.33.28_d2d0929a.jpg',
    icon: 'fas fa-spa',
    body: (
      <>
        <p>Sanyod के माध्यम से, निम्नलिखित विषयों के मार्गदर्शन प्रदान करता हूँ:</p>
        <ul className="check-list">
          <li>
            <span>
              <strong>ऑनलाइन कोर्स:</strong> सांख्य और योग के सिद्धांतों पर आधारित पाठ्यक्रम
            </span>
          </li>
          <li>
            <span>
              <strong>रिट्रीट प्रोग्राम:</strong> प्रकृति के बीच आयुर्वेद और योग पर आधारित रिट्रीट
            </span>
          </li>
          <li>
            <span>
              <strong>मनोवैज्ञानिक परामर्श:</strong> सांख्य और योग के सिद्धांतों को मनोविज्ञान के साथ जोड़कर
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'स्वयं के साथ जुड़ें',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    icon: 'fas fa-infinity',
    body: (
      <>
        <p>इसका उद्देश्य आपको एक ऐसा मार्ग दिखाना है, जहाँ आप अपने शरीर, मन, और आत्मा के बीच संतुलन स्थापित कर सकें।</p>
        <p>SanYod केवल एक वेबसाइट नहीं, बल्कि एक जीवनशैली है—जो आपको प्रकृति, स्वयं, और ब्रह्मांड के साथ एकरूप होने की प्रेरणा देती है।</p>
        <p>आइए, सांख्य और योग के इस वैज्ञानिक और आध्यात्मिक मार्ग पर एक साथ चलें, और जीवन के हर पहलू में संपूर्णता प्राप्त करें।</p>
        <p className="mb-0 fw-600 text-ink">
          — साधक जामवंत · <a href="mailto:jamwantsingh05@gmail.com">jamwantsingh05@gmail.com</a>
        </p>
      </>
    ),
  },
];

/** About (about.php). */
export default function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: 'About' }]}
        deva="सांख्य योग दर्शन"
        eyebrow="About SANYOD"
        title="Ancient philosophy for a balanced modern life"
        lead="SANYOD brings the Sankhya and Yoga darshan to everyday life through courses, retreats, books and personal guidance, led by Sadhaka Jamwant."
      />
      {BLOCKS.map((b, i) => (
        <section key={b.title} className={`section${i % 2 ? ' section-alt' : ''}`}>
          <div className="container">
            <div className="row align-items-center g-5">
              <div className={`col-lg-6 ${i % 2 ? 'order-lg-2' : ''}`}>
                <div className="split-media reveal">
                  <FitImage src={b.image} loading="lazy" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="reveal">
                  <span className="icon-badge">
                    <i className={b.icon}></i>
                  </span>
                  <h2 className="deva mb-3">{b.title}</h2>
                  <div className="prose deva-text" lang="hi">
                    {b.body}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
      <section className="section pt-0 section-alt">
        <div className="container">
          <CtaBand
            deva="आइए, साथ चलें"
            title="Begin your journey with SANYOD"
            lead="Explore courses, books and personal guidance rooted in Sankhya and Yoga."
            actions={
              <>
                <Link to="/courses" className="btn btn-primary btn-lg">
                  Explore courses
                </Link>
                <Link to="/contact" className="btn btn-outline-light btn-lg">
                  Contact us
                </Link>
              </>
            }
          />
        </div>
      </section>
    </>
  );
}
