// Port of the inline script on live lab.php.
import { countUpOnView, hoverStyle, revealOnScroll } from '@/effects/common';
import { $all, randomItem, type EffectScope } from '@/effects/EffectScope';

const BOOK_COLORS = [
  'linear-gradient(135deg, #4B0082 0%, #800000 100%)',
  'linear-gradient(135deg, #8A9A5B 0%, #B87333 100%)',
  'linear-gradient(135deg, #800000 0%, #B87333 100%)',
  'linear-gradient(135deg, #008080 0%, #8A9A5B 100%)',
  'linear-gradient(135deg, #FF9933 0%, #FFD700 100%)',
];
const BOOK_TITLES = ['वेद', 'उपनिषद्', 'गीता', 'योग', 'धर्म'];
const RANDOM_SCRIPTURES = ['Rigveda 1.1.1', 'Bhagavad Gita 2.47', 'Yoga Sutras 1.2', 'Dhammapada Verse 1', 'Ashtavakra Gita 1.1'];
const rnd = (spread: number) => Math.random() * spread - spread / 2;

function createFloatingBooks(scope: EffectScope) {
  const main = document.querySelector('main');
  if (!main) return;
  const books = document.createElement('div');
  books.id = 'dynamic-books';
  scope.append(main, books);
  for (let i = 0; i < 8; i++) {
    const book = document.createElement('div');
    book.className = 'dynamic-book';
    Object.assign(book.style, {
      width: `${Math.random() * 30 + 40}px`,
      height: `${Math.random() * 40 + 60}px`,
      background: randomItem(BOOK_COLORS),
      borderRadius: '5px',
      boxShadow: 'var(--shadow-book)',
      opacity: String(Math.random() * 0.2 + 0.1),
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      position: 'fixed',
      zIndex: '-1',
      pointerEvents: 'none',
      transformStyle: 'preserve-3d',
      animation: `floatBookDynamic ${Math.random() * 25 + 20}s ease-in-out ${Math.random() * 5}s infinite`,
    });
    const spine = document.createElement('div');
    Object.assign(spine.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '15px',
      height: '100%',
      background: 'linear-gradient(to right, #B87333 0%, #800000 100%)',
      borderRadius: '3px 0 0 3px',
    });
    book.appendChild(spine);
    const title = document.createElement('div');
    title.textContent = randomItem(BOOK_TITLES);
    Object.assign(title.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(-90deg)',
      fontFamily: 'Sanskrit, serif',
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.7)',
      whiteSpace: 'nowrap',
    });
    book.appendChild(title);
    books.appendChild(book);
  }
  scope.injectStyle(`
    @keyframes floatBookDynamic {
      0%, 100% { transform: translate(0, 0) rotateY(0deg) scale(1); }
      25% { transform: translate(${rnd(150)}px, ${rnd(75)}px) rotateY(90deg) scale(1.1); }
      50% { transform: translate(${rnd(150)}px, ${rnd(75)}px) rotateY(180deg) scale(1); }
      75% { transform: translate(${rnd(150)}px, ${rnd(75)}px) rotateY(270deg) scale(0.9); }
    }
  `);
}

/** Search is simulated on live (no real library index yet; docs/01 out of scope). */
function setupLibrarySearch(scope: EffectScope) {
  const input = document.querySelector<HTMLInputElement>('.search-input-library');
  const button = document.querySelector<HTMLButtonElement>('.search-box-library .btn-library');
  if (input && button) {
    scope.on(button, 'click', () => {
      const query = input.value.trim();
      if (!query) return;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      button.disabled = true;
      scope.timeout(() => {
        window.alert(`Searching for: "${query}"\n\nThis would search across 10,000+ texts in our library.`);
        button.innerHTML = '<i class="fas fa-search"></i>';
        button.disabled = false;
      }, 1000);
    });
    scope.on(input, 'keypress', (e) => {
      if (e.key === 'Enter') button.click();
    });
  }
  const randomBtn = document.querySelector<HTMLElement>('[href*="Random"]');
  if (randomBtn) {
    scope.on(randomBtn, 'click', (e) => {
      e.preventDefault();
      window.alert(`Random Scripture: ${randomItem(RANDOM_SCRIPTURES)}\n\nRedirecting to this text...`);
    });
  }
}

export function setupLibraryEffects(scope: EffectScope): void {
  createFloatingBooks(scope);
  revealOnScroll(scope, '.category-card-library, .scripture-card-library, .manuscript-card-library, .digital-card-library, .resource-card-library', {
    onReveal: (el) => {
      if (!el.classList.contains('scripture-card-library')) return;
      scope.timeout(() => {
        const spine = el.querySelector<HTMLElement>('.book-spine');
        if (spine) spine.style.transform = 'scaleX(1.1)';
      }, 300);
    },
  });
  setupLibrarySearch(scope);

  for (const card of $all('.scripture-card-library')) {
    const spine = card.querySelector<HTMLElement>('.book-spine');
    scope.on(card, 'mouseenter', () => {
      if (spine) {
        spine.style.transform = 'scaleX(1.2)';
        spine.style.transition = 'transform 0.3s ease';
      }
      card.style.zIndex = '10';
    });
    scope.on(card, 'mouseleave', () => {
      if (spine) spine.style.transform = 'scaleX(1)';
      card.style.zIndex = '1';
    });
  }

  countUpOnView(scope, '.stat-number-library', { steps: 30, stepMs: 50, keepPlus: true });

  const pattern = document.querySelector<HTMLElement>('.library-pattern');
  if (pattern) {
    let pos = 0;
    scope.interval(() => {
      pos += 0.5;
      pattern.style.backgroundPosition = `0 ${pos}px, 0 ${pos}px`;
    }, 50);
  }

  hoverStyle(
    scope,
    '.category-card-library',
    (card) => {
      const icon = card.querySelector<HTMLElement>('.category-icon-library');
      if (icon) icon.style.boxShadow = '0 0 30px rgba(255, 153, 51, 0.3)';
    },
    (card) => {
      const icon = card.querySelector<HTMLElement>('.category-icon-library');
      if (icon) icon.style.boxShadow = 'none';
    },
  );
}
