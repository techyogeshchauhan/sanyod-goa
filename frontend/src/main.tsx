// Global CSS in the same cascade order as the live <head> (header.php) and footer (docs/07 § 6.1).
import '@fortawesome/fontawesome-free/css/all.min.css'; //       1. Font Awesome 5.15.4
import 'bootstrap-icons/font/bootstrap-icons.css'; //            2. Bootstrap Icons 1.4.1
import './styles/legacy/animate.min.css'; //                     3. lib/animate (animate.css 3.5.2, from live)
import './styles/legacy/owl.carousel.min.css'; //                4. lib/owlcarousel (Owl Carousel 2.2.1, from live)
import 'bootstrap/dist/css/bootstrap.min.css'; //                5. Bootstrap 5.1.3 (live CDN)
import './styles/legacy/bootstrap.theme.min.css'; //             6. themed Bootstrap: brand red/navy
import './styles/legacy/style.css'; //                           7. template CSS
import './styles/layout/header.css'; //                          8. header.php inline CSS
import './styles/layout/footer.css'; //                          9. footer.php inline CSS (global)
// 10. Page CSS (*.page.css) is imported by each page and scoped to body.page-<name>.
import 'bootstrap'; // Bootstrap JS data API (collapse, dropdown, modal)

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';
import { router } from '@/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 60 * 1000 },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing in index.html');

createRoot(root).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
