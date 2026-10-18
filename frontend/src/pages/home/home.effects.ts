// Port of the two inline scripts on live index.php.
import { hoverStyle, revealOnScroll } from '@/effects/common';
import { $all, pageKeyframes, randomItem, type EffectScope } from '@/effects/EffectScope';

const PARTICLE_COLORS = ['#FF9933', '#FFD700', '#50C878', '#4A90E2', '#8A2BE2', '#FF6B6B', '#00A693', '#FF69B4'];

function createColorParticles(scope: EffectScope) {
  const container = document.getElementById('color-particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'color-particle';
    const size = Math.random() * 60 + 20;
    Object.assign(particle.style, {
      width: `${size}px`,
      height: `${size}px`,
      background: randomItem(PARTICLE_COLORS),
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `${pageKeyframes('float', 'home')} ${Math.random() * 20 + 10}s ease-in-out ${Math.random() * 5}s infinite`,
      opacity: String(Math.random() * 0.5 + 0.2),
    });
    scope.append(container, particle);
  }
}

/** Live typing effect: type `speed` ms/char, delete 50 ms/char, hold 1000 ms, 300 ms before the next word. */
function typingAnimation(scope: EffectScope, elementId: string, words: readonly string[], speed = 150) {
  const element = document.getElementById(elementId);
  if (!element) return;
  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;
  const type = () => {
    const word = words[wordIndex] ?? '';
    let delay: number;
    if (deleting) {
      element.textContent = word.substring(0, charIndex - 1);
      charIndex--;
      delay = 50;
    } else {
      element.textContent = word.substring(0, charIndex + 1);
      charIndex++;
      delay = speed;
    }
    if (!deleting && charIndex === word.length) {
      delay = 1000;
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 300;
    }
    scope.timeout(type, delay);
  };
  type();
}

function cardHover(scope: EffectScope, selector: string) {
  for (const card of $all(selector)) card.style.cursor = 'pointer';
  hoverStyle(
    scope,
    selector,
    (card) => {
      card.style.transform = 'translateY(-10px) rotateY(5deg)';
      card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
    },
    (card) => {
      card.style.transform = 'translateY(0) rotateY(0)';
      card.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)';
    },
  );
}

const STATIC_CARDS = '.course-card-vibrant:not([data-course-card])';
const COURSE_CARDS = '.course-card-vibrant[data-course-card]';

export function setupHomeEffects(scope: EffectScope): void {
  createColorParticles(scope);
  typingAnimation(scope, 'typing1', ['Housewives', 'Students', 'Professionals', 'Seekers']);
  typingAnimation(scope, 'typing2', ['American', 'Nepali', 'UAE', 'English', 'Australian'], 200);
  revealOnScroll(scope, `.feature-card-colorful, ${STATIC_CARDS}, .why-card-vibrant`, {
    transition: 'all 0.6s ease-out',
    addAnimatedClass: false,
  });
  scope.interval(() => {
    for (const card of $all('.feature-card-colorful')) {
      card.style.borderColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    }
  }, 5000);
  cardHover(scope, STATIC_CARDS);
}

/** Same reveal/hover for the course cards, which render after the API responds. */
export function setupHomeCourseCardEffects(scope: EffectScope): void {
  revealOnScroll(scope, COURSE_CARDS, { transition: 'all 0.6s ease-out', addAnimatedClass: false });
  cardHover(scope, COURSE_CARDS);
}
