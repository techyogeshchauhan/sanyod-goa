// Port of the inline script on live ind_know.php.
import { revealOnScroll, hoverStyle } from '@/effects/common';
import { $all, pageKeyframes, randomItem, type EffectScope } from '@/effects/EffectScope';

const COLORS = ['#FF9933', '#FFD700', '#E6A8D7', '#4B0082', '#800000', '#006400', '#87CEEB', '#FFC324'];
const PARTICLE_MANTRAS = ['ॐ', 'ॐ नमः शिवाय', 'हरे कृष्ण', 'राम', 'गुरु'];
const CHANT_MANTRAS = ['ॐ', 'हरे कृष्ण', 'राम', 'शिवाय'];
const rnd = (spread: number) => Math.random() * spread - spread / 2;

function createDivineParticles(scope: EffectScope) {
  const container = document.getElementById('divine-particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'divine-particle';
    const isMantra = Math.random() > 0.7;
    const size = isMantra ? 40 : Math.random() * 20 + 5;
    const color = randomItem(COLORS);
    if (isMantra) {
      particle.textContent = randomItem(PARTICLE_MANTRAS);
      Object.assign(particle.style, {
        fontFamily: 'Sanskrit, serif',
        fontSize: `${size}px`,
        color,
        background: 'transparent',
        textShadow: `0 0 10px ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    } else {
      Object.assign(particle.style, { width: `${size}px`, height: `${size}px`, background: color, borderRadius: '50%' });
    }
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animation = `floatDivine ${Math.random() * 30 + 20}s ease-in-out ${Math.random() * 5}s infinite`;
    particle.style.opacity = String(Math.random() * 0.5 + 0.3);
    scope.append(container, particle);
  }
  scope.injectStyle(`
    @keyframes floatDivine {
      0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); filter: blur(1px); }
      25% { transform: translate(${rnd(100)}px, ${rnd(50)}px) rotate(90deg) scale(1.1); filter: blur(0px); }
      50% { transform: translate(${rnd(100)}px, ${rnd(50)}px) rotate(180deg) scale(1); filter: blur(1px); }
      75% { transform: translate(${rnd(100)}px, ${rnd(50)}px) rotate(270deg) scale(0.9); filter: blur(0px); }
    }
  `);
}

export function setupIndianKnowledgeEffects(scope: EffectScope): void {
  createDivineParticles(scope);
  revealOnScroll(scope, '.wisdom-card-divine, .scripture-card-divine, .meditation-card-divine, .teacher-card-divine, .quote-card-divine');

  // Mantra chanting: rotate the Sanskrit text every 5 s and restart its glow animation.
  let current = 0;
  const glow = `${pageKeyframes('sanskritGlow', 'ind-know')} 4s ease-in-out infinite alternate`;
  scope.interval(() => {
    for (const el of $all('.sanskrit-text-divine')) {
      el.textContent = CHANT_MANTRAS[current] ?? '';
      el.style.animation = 'none';
      void el.offsetWidth; // restart the animation
      el.style.animation = glow;
    }
    current = (current + 1) % CHANT_MANTRAS.length;
  }, 5000);

  hoverStyle(
    scope,
    '.btn-divine',
    (btn) => (btn.style.boxShadow = '0 0 40px rgba(255, 153, 51, 0.5)'),
    (btn) => (btn.style.boxShadow = 'var(--shadow-divine)'),
  );

  scope.interval(() => {
    for (const icon of $all('.wisdom-icon-divine')) {
      icon.style.transform = `rotate(${Math.random() * 10 - 5}deg) scale(${1 + Math.random() * 0.1})`;
    }
  }, 3000);
}
