import { $all, type EffectScope } from './EffectScope';

interface RevealOptions {
  /** CSS transition applied while hidden (live default: 0.8s spring easing). */
  transition?: string;
  /** Live pages add an `animated` class when revealed (except the home page). */
  addAnimatedClass?: boolean;
  onReveal?: (el: HTMLElement) => void;
}

/** Live pattern: start at opacity 0 / translateY(30px), reveal when 10% visible. */
export function revealOnScroll(scope: EffectScope, selector: string, options: RevealOptions = {}): void {
  const {
    transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    addAnimatedClass = true,
    onReveal,
  } = options;
  const elements = $all(selector);
  for (const el of elements) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    if (transition) el.style.transition = transition;
  }
  scope.observe(
    elements,
    (entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      if (addAnimatedClass) el.classList.add('animated');
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      onReveal?.(el);
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
  );
}

/**
 * Count-up animation used on several live pages. Live code ended on parseInt(text), which
 * dropped suffixes ("500+" → "500", "4.8/5" → "4"); here it ends on the original text
 * (allowed adjustment A11).
 */
export function countUpOnView(
  scope: EffectScope,
  selector: string,
  { steps, stepMs, keepPlus = false }: { steps: number; stepMs: number; keepPlus?: boolean },
): void {
  for (const el of $all(selector)) {
    const original = el.textContent ?? '';
    const target = parseInt(original, 10);
    if (Number.isNaN(target)) continue;
    const increment = target / steps;
    let current = 0;
    const tick = () => {
      if (current < target) {
        current += increment;
        el.textContent = `${Math.floor(current)}${keepPlus && original.includes('+') ? '+' : ''}`;
        scope.timeout(tick, stepMs);
      } else {
        el.textContent = original;
      }
    };
    scope.observe(
      [el],
      (entry, observer) => {
        if (!entry.isIntersecting) return;
        tick();
        observer.unobserve(entry.target);
      },
      { threshold: 0.5 },
    );
  }
}

/** Inline-style hover effect (mouseenter/mouseleave pairs from the live scripts). */
export function hoverStyle(
  scope: EffectScope,
  selector: string,
  enter: (el: HTMLElement) => void,
  leave: (el: HTMLElement) => void,
): void {
  for (const el of $all(selector)) {
    scope.on(el, 'mouseenter', () => enter(el));
    scope.on(el, 'mouseleave', () => leave(el));
  }
}
