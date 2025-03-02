import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import TalentRegistration from "@/pages/talent-registration";
import TalentDashboard from "@/pages/talent-dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import JobDetail from "@/pages/job-detail";
import StoreDashboard from "@/pages/store-dashboard";
import { AgeVerificationModal } from "@/components/age-verification-modal";
import MyPage from "@/pages/my-page";
import BasicInfoEdit from "@/pages/basic-info-edit";
import Jobs from "@/pages/jobs";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/:id" component={JobDetail} />
      <ProtectedRoute path="/talent/dashboard" component={TalentDashboard} />
      <ProtectedRoute path="/talent/register" component={TalentRegistration} />
      <ProtectedRoute path="/talent/profile/edit" component={BasicInfoEdit} />
      <ProtectedRoute path="/talent/resume/edit" component={TalentRegistration} />
      <ProtectedRoute path="/talent/mypage" component={MyPage} />
      <ProtectedRoute path="/talent/mypage/applications" component={MyPage} />
      <ProtectedRoute path="/talent/mypage/keep-list" component={MyPage} />
      <ProtectedRoute path="/talent/mypage/view-history" component={MyPage} />
      <ProtectedRoute path="/store/dashboard" component={StoreDashboard} />
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