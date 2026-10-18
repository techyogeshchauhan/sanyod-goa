// Port of the inline script on live presonal.php (the consultation modal is a React component).
import { countUpOnView, hoverStyle } from '@/effects/common';
import { $all, pageKeyframes, randomItem, type EffectScope } from '@/effects/EffectScope';

const SYMBOLS = ['ॐ', 'गुरु', 'ज्ञान', 'शान्ति', 'आनन्द'];
const COLORS = ['#FF9933', '#4B0082', '#228B22', '#87CEEB', '#FFD700'];
const rnd = (spread: number) => Math.random() * spread - spread / 2;

function createGuidanceElements(scope: EffectScope) {
  const main = document.querySelector('main');
  if (!main) return;
  const container = document.createElement('div');
  container.id = 'dynamic-guidance';
  scope.append(main, container);
  for (let i = 0; i < 10; i++) {
    const el = document.createElement('div');
    el.className = 'floating-guidance-symbol';
    el.textContent = randomItem(SYMBOLS);
    Object.assign(el.style, {
      fontFamily: 'Sanskrit, serif',
      fontSize: `${Math.random() * 30 + 20}px`,
      color: randomItem(COLORS),
      opacity: String(Math.random() * 0.2 + 0.1),
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      position: 'fixed',
      zIndex: '-1',
      pointerEvents: 'none',
      animation: `floatSymbol ${Math.random() * 25 + 20}s ease-in-out ${Math.random() * 5}s infinite`,
    });
    container.appendChild(el);
  }
  scope.injectStyle(`
    @keyframes floatSymbol {
      0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.1; }
      25% { transform: translate(${rnd(200)}px, ${rnd(100)}px) rotate(90deg) scale(1.2); opacity: 0.2; }
      50% { transform: translate(${rnd(200)}px, ${rnd(100)}px) rotate(180deg) scale(1); opacity: 0.1; }
      75% { transform: translate(${rnd(200)}px, ${rnd(100)}px) rotate(270deg) scale(0.8); opacity: 0.2; }
    }
  `);
}

function animateGuidanceCards(scope: EffectScope) {
  const els = $all('.path-card-guidance, .mentor-card-guidance, .process-step-guidance, .session-card-guidance, .testimonial-card-guidance, .faq-card-guidance');
  for (const el of els) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
  }
  const steps = $all('.process-step-guidance');
  scope.observe(
    els,
    (entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      el.classList.add('animated');
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      if (el.classList.contains('process-step-guidance')) {
        scope.timeout(() => {
          el.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }, steps.indexOf(el) * 200);
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
  );
}

function setupFaq(scope: EffectScope) {
  const cards = $all('.faq-card-guidance');
  for (const card of cards) {
    scope.on(card, 'click', () => {
      cards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      scope.timeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
    });
  }
}

export function setupPersonalGuidanceEffects(scope: EffectScope): void {
  createGuidanceElements(scope);
  animateGuidanceCards(scope);
  setupFaq(scope);

  hoverStyle(
    scope,
    '.mentor-card-guidance',
    (card) => (card.style.zIndex = '10'),
    (card) => (card.style.zIndex = '1'),
  );

  for (const path of $all('.progress-path')) {
    path.style.animation = 'none';
    void path.offsetWidth;
    path.style.animation = `${pageKeyframes('pathShimmer', 'personal-guidance')} 2s infinite`;
  }

  countUpOnView(scope, '.process-section h3', { steps: 30, stepMs: 50 });
}
