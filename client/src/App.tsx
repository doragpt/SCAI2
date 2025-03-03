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
import MyPage from "@/pages/my-page";
import BasicInfoEdit from "@/pages/basic-info-edit";
import Jobs from "@/pages/jobs";
import KeepListPage from "@/pages/keep-list";
import ViewHistoryPage from "@/pages/view-history";
import { AgeVerificationModal } from "@/components/age-verification-modal";
import { useState, useEffect } from "react";
import ProfileViewPage from "@/pages/profile-view-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/:id" component={JobDetail} />
      <ProtectedRoute path="/talent/dashboard" component={TalentDashboard} />
      <ProtectedRoute path="/talent/register" component={TalentRegistration} />
      <ProtectedRoute path="/talent/profile" component={ProfileViewPage} />
      <ProtectedRoute path="/talent/profile/edit" component={BasicInfoEdit} />
      <ProtectedRoute path="/talent/resume/edit" component={TalentRegistration} />
      <ProtectedRoute path="/talent/mypage" component={MyPage} />
      <ProtectedRoute path="/talent/mypage/applications" component={MyPage} />
      <ProtectedRoute path="/talent/mypage/keep-list" component={KeepListPage} />
      <ProtectedRoute path="/talent/mypage/view-history" component={ViewHistoryPage} />
      <ProtectedRoute path="/store/dashboard" component={StoreDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [showAgeVerification, setShowAgeVerification] = useState(true);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem("ageVerified");
    if (verified === "true") {
      setIsAgeVerified(true);
      setShowAgeVerification(false);
    }
  }, []);

  const handleAgeVerification = (verified: boolean) => {
    if (verified) {
      localStorage.setItem("ageVerified", "true");
      setIsAgeVerified(true);
    } else {
      window.location.href = "https://www.google.com";
    }
    setShowAgeVerification(false);
  };

  if (!isAgeVerified && showAgeVerification) {
    return (
      <AgeVerificationModal
        open={showAgeVerification}
        onOpenChange={setShowAgeVerification}
        onVerify={handleAgeVerification}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}