import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CardCatalog from '@/pages/CardCatalog';
import ImportPage from '@/pages/ImportPage';
import AdminRouteGuard from '@/components/AdminRouteGuard';

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: CardCatalog,
});

const importRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/import',
  component: () => (
    <AdminRouteGuard>
      <ImportPage />
    </AdminRouteGuard>
  ),
});

const routeTree = rootRoute.addChildren([indexRoute, importRoute]);

const router = createRouter({ routeTree });

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
