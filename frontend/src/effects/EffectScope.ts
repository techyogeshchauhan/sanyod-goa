/**
 * Collects everything a ported page script creates (timers, listeners, observers, injected
 * nodes) so it can all be undone when the page unmounts. The live pages ran these scripts on
 * DOMContentLoaded against static markup; we run them after React renders that same markup.
 */
export class EffectScope {
  private cleanups: Array<() => void> = [];
  private disposed = false;

  get isDisposed(): boolean {
    return this.disposed;
  }

  add(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  timeout(fn: () => void, ms: number): void {
    const id = window.setTimeout(() => {
      if (!this.disposed) fn();
    }, ms);
    this.add(() => window.clearTimeout(id));
  }

  interval(fn: () => void, ms: number): void {
    const id = window.setInterval(fn, ms);
    this.add(() => window.clearInterval(id));
  }

  on<K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, handler: (ev: HTMLElementEventMap[K]) => void): void {
    el.addEventListener(type, handler);
    this.add(() => el.removeEventListener(type, handler));
  }

  observe(
    targets: Iterable<Element>,
    callback: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void,
    options?: IntersectionObserverInit,
  ): IntersectionObserver {
    const observer = new IntersectionObserver((entries, obs) => entries.forEach((e) => callback(e, obs)), options);
    for (const t of targets) observer.observe(t);
    this.add(() => observer.disconnect());
    return observer;
  }

  /** Appends a node that is removed again on dispose. */
  append<T extends Node>(parent: Node, node: T): T {
    parent.appendChild(node);
    this.add(() => node.parentNode?.removeChild(node));
    return node;
  }

  /** Injects a <style> into <head> (removed on dispose). */
  injectStyle(css: string): void {
    const style = document.createElement('style');
    style.textContent = css;
    this.append(document.head, style);
  }

  dispose(): void {
    this.disposed = true;
    for (const fn of this.cleanups.splice(0).reverse()) fn();
  }
}

export const $all = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(selector));

/** Keyframes from a page stylesheet are renamed per page by scripts/postcss-page-scope.js. */
export const pageKeyframes = (name: string, page: string): string => `${name}--page-${page}`;

export const randomItem = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)] as T;
