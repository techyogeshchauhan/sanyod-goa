import { Outlet, ScrollRestoration } from 'react-router-dom';
import { BackToTop } from '@/components/layout/BackToTop';
import { Footer } from '@/components/layout/Footer';
import { NavBar } from '@/components/layout/NavBar';
import { TopBar } from '@/components/layout/TopBar';

/** Shared shell of every public page: header.php + page + footer.php. */
export function PublicLayout() {
  return (
    <>
      <TopBar />
      <NavBar />
      {/* No wrapper: live pages render their own <main> directly after the navbar. */}
      <Outlet />
      <Footer />
      <BackToTop />
      <ScrollRestoration />
    </>
  );
}
