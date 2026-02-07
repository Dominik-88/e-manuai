import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ManualPage from "@/pages/ManualPage";
import ServicePage from "@/pages/ServicePage";
import NewServicePage from "@/pages/NewServicePage";
import AreasPage from "@/pages/AreasPage";
import NewAreaPage from "@/pages/NewAreaPage";
import NewOperationPage from "@/pages/NewOperationPage";
import SettingsPage from "@/pages/SettingsPage";
import AssistantPage from "@/pages/AssistantPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              <Route path="/servis/:id" element={<ServicePage />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
