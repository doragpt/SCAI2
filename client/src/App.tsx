import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import TalentRegistration from "@/pages/talent-registration";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import JobDetail from "@/pages/job-detail";
import StoreDashboard from "@/pages/store-dashboard";
import { AgeVerificationModal } from "@/components/age-verification-modal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/jobs/:id" component={JobDetail} />
      <ProtectedRoute path="/store/dashboard" component={StoreDashboard} />
      <ProtectedRoute path="/talent/register" component={TalentRegistration} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AgeVerificationModal />
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;