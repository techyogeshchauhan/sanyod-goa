import { Outlet, ScrollRestoration } from 'react-router-dom';
import { BackToTop } from '@/components/layout/BackToTop';
import { Footer } from '@/components/layout/Footer';
import { NavBar } from '@/components/layout/NavBar';
import { useReveal } from '@/components/ui';

/** Shared shell of every public page: header, page, footer. */
export function PublicLayout() {
  useReveal();
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
