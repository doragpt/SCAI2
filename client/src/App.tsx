import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import TalentRegistration from "@/pages/talent-registration";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import JobDetail from "@/pages/job-detail";
import StoreDashboard from "@/pages/store-dashboard";
import ManagerLogin from "@/pages/manager/login";
import MyPage from "@/pages/my-page";
import Jobs from "@/pages/jobs";
import KeepListPage from "@/pages/keep-list";
import ViewHistoryPage from "@/pages/view-history";
import { AgeVerificationModal } from "@/components/age-verification-modal";
import { useState, useEffect } from "react";
import AIMatchingPage from "@/pages/talent/ai-matching";
import { Navigation } from "@/components/navigation";
import ProfileViewPage from "@/pages/profile-view-page";
import BasicInfoView from "@/pages/basic-info-view";
import BasicInfoEdit from "@/pages/basic-info-edit";
import NewBlogPost from "@/pages/store/blog/new";
import EditBlogPost from "@/pages/store/blog/edit/[id]";
import BlogPostView from "@/pages/blog/[id]";
import BlogManagement from "@/pages/store/blog/index";
import StoreDesignManager from "@/pages/store/design-manager";
import StorePreview from "@/pages/store/preview";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/talent">
        {() => <Redirect to="/talent/mypage" />}
      </Route>
      <ProtectedRoute path="/talent/register" component={TalentRegistration} />
      <ProtectedRoute path="/talent/ai-matching" component={AIMatchingPage} />
      <ProtectedRoute path="/talent/mypage" component={MyPage} />
      <ProtectedRoute path="/talent/profile/view" component={ProfileViewPage} />
      <ProtectedRoute path="/talent/mypage/keep-list" component={KeepListPage} />
      <ProtectedRoute path="/talent/mypage/view-history" component={ViewHistoryPage} />
      <Route path="/manager/login" component={ManagerLogin} />
      <ProtectedRoute 
        path="/store/dashboard" 
        component={StoreDashboard}
        roleRequired="store"
      />
      <ProtectedRoute 
        path="/store/blog"
        component={BlogManagement}
        roleRequired="store"
      />
      <ProtectedRoute 
        path="/store/blog/new" 
        component={NewBlogPost}
        roleRequired="store"
      />
      <ProtectedRoute 
        path="/store/blog/edit/:id" 
        component={EditBlogPost}
        roleRequired="store"
      />
      <ProtectedRoute 
        path="/store/design-manager" 
        component={StoreDesignManager}
        roleRequired="store"
      />
      <ProtectedRoute 
        path="/store/preview" 
        component={StorePreview}
        roleRequired="store"
      />
      <Route path="/blog/:id" component={BlogPostView} />
      <ProtectedRoute path="/basic-info/view" component={BasicInfoView} />
      <ProtectedRoute path="/basic-info/edit" component={BasicInfoEdit} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showAgeVerification, setShowAgeVerification] = useState(true);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const { user } = useAuth();

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

  // 年齢確認モーダルの表示条件
  if (!isAgeVerified && showAgeVerification) {
    return (
      <AgeVerificationModal
        open={showAgeVerification}
        onOpenChange={setShowAgeVerification}
        onVerify={handleAgeVerification}
      />
    );
  }

  // ナビゲーションの表示判定
  // ログインページ以外では常にナビゲーションを表示
  const shouldShowNavigation = !window.location.pathname.startsWith('/manager/login');

  return (
    <div className="min-h-screen bg-background">
      {shouldShowNavigation && <Navigation />}
      <main className="container mx-auto px-4 py-6">
        <Router />
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}