import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { BackToTop } from '@/components/layout/BackToTop';
import { Footer } from '@/components/layout/Footer';
import { NavBar } from '@/components/layout/NavBar';
import { useReveal } from '@/components/ui';

/**
 * In-page links (<a href="#section">): the router treats a hash change as a navigation and
 * ScrollRestoration puts the page back where it was, so the browser's own jump never shows.
 * Scroll to the target ourselves and update the address without a router navigation.
 */
function useInPageLinks() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const id = link?.getAttribute('href')?.slice(1);
      if (!id || link?.hasAttribute('data-bs-toggle')) return;
      const target = document.getElementById(decodeURIComponent(id));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(window.history.state, '', `#${id}`);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}

/** Shared shell of every public page: header, page, footer. */
export function PublicLayout() {
  useReveal();
  useInPageLinks();
  return (
    <>
      <NavBar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
      <ScrollRestoration />
    </>
  );
}
