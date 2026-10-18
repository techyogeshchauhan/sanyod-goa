// Port of the inline script on live counity.php.
import { countUpOnView, hoverStyle, revealOnScroll } from '@/effects/common';
import { $all, pageKeyframes, randomItem, type EffectScope } from '@/effects/EffectScope';

const DIYA_COLORS = ['#FF9933', '#FFD700', '#800000', '#FFC324'];
const kf = (name: string) => pageKeyframes(name, 'community');

function createFloatingDiyas(scope: EffectScope) {
  const main = document.querySelector('main');
  if (!main) return;
  const container = document.createElement('div');
  container.id = 'dynamic-diyas';
  scope.append(main, container);
  for (let i = 0; i < 8; i++) {
    const diya = document.createElement('div');
    diya.className = 'floating-diya';
    const color = randomItem(DIYA_COLORS);
    const size = Math.random() * 20 + 30;
    Object.assign(diya.style, {
      width: `${size}px`,
      height: `${size * 1.5}px`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      background: `linear-gradient(135deg, ${color}, ${color}80)`,
      animation: `${kf('floatDiya')} ${Math.random() * 20 + 15}s ease-in-out ${Math.random() * 5}s infinite`,
      opacity: String(Math.random() * 0.3 + 0.2),
    });
    const flame = document.createElement('div');
    Object.assign(flame.style, {
      position: 'absolute',
      top: '-15px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: `${size * 0.5}px`,
      height: `${size * 0.8}px`,
      background: 'linear-gradient(to top, #FFD700, #FF9933, #FF4500)',
      borderRadius: '50% 50% 20% 20%',
      filter: 'blur(5px)',
      animation: `${kf('flameFlicker')} 2s ease-in-out infinite`,
    });
    diya.appendChild(flame);
    container.appendChild(diya);
  }
}

export function setupCommunityEffects(scope: EffectScope): void {
  createFloatingDiyas(scope);
  revealOnScroll(
    scope,
    '.feature-card-satsang, .schedule-card-satsang, .member-card-satsang, .bhajan-card-satsang, .forum-card-satsang, .virtual-card-satsang, .testimonial-card-satsang',
  );
  countUpOnView(scope, '.join-cta-satsang h3', { steps: 50, stepMs: 30 });

  hoverStyle(
    scope,
    '.btn-satsang',
    (btn) => (btn.style.filter = 'brightness(1.2) drop-shadow(0 0 20px rgba(255, 153, 51, 0.5))'),
    (btn) => (btn.style.filter = 'none'),
  );

  const liveBadge = document.querySelector<HTMLElement>('.schedule-badge');
  if (liveBadge && liveBadge.textContent === 'Live') {
    scope.interval(() => {
      liveBadge.style.opacity = liveBadge.style.opacity === '0.5' ? '1' : '0.5';
    }, 1000);
  }

  for (const text of $all('.sanskrit-satsang')) text.style.transition = 'all 0.5s ease';
  hoverStyle(
    scope,
    '.sanskrit-satsang',
    (text) => {
      text.style.transform = 'translateY(-5px) scale(1.1)';
      text.style.textShadow = '0 5px 15px rgba(255, 153, 51, 0.3)';
    },
    (text) => {
      text.style.transform = 'none';
      text.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.1)';
    },
  );
}
