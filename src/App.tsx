import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
const AppLayout = lazy(() => import("@/components/layout/AppLayout").then(m => ({ default: m.AppLayout })));

// Lazy-loaded route components to reduce initial JS bundle
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const SignupPage = lazy(() => import("@/pages/auth/SignupPage"));
const ManualPage = lazy(() => import("@/pages/ManualPage"));
const ServicePage = lazy(() => import("@/pages/ServicePage"));
const ServiceDetailPage = lazy(() => import("@/pages/ServiceDetailPage"));
const NewServicePage = lazy(() => import("@/pages/NewServicePage"));
const AreasPage = lazy(() => import("@/pages/AreasPage"));
const NewAreaPage = lazy(() => import("@/pages/NewAreaPage"));
const NewOperationPage = lazy(() => import("@/pages/NewOperationPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AssistantPage = lazy(() => import("@/pages/AssistantPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public auth routes */}
              <Route path="/prihlaseni" element={<LoginPage />} />
              <Route path="/registrace" element={<SignupPage />} />

              {/* Protected routes with app layout */}
              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/manual" element={<ManualPage />} />
                <Route path="/manual/:section" element={<ManualPage />} />
                <Route path="/servis" element={<ServicePage />} />
                <Route path="/servis/novy" element={<NewServicePage />} />
                <Route path="/servis/:id" element={<ServiceDetailPage />} />
                <Route path="/arealy" element={<AreasPage />} />
                <Route path="/arealy/novy" element={<NewAreaPage />} />
                <Route path="/arealy/:id" element={<AreasPage />} />
                <Route path="/provoz/novy" element={<NewOperationPage />} />
                <Route path="/nastaveni" element={<SettingsPage />} />
                <Route path="/asistent" element={<AssistantPage />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
