import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ScoutDashboard from "@/pages/scout-dashboard";
import TalentRegistration from "@/pages/talent-registration";
import { ProtectedRoute } from "./lib/protected-route";
import RootPage from "@/pages/root-page"; // Assuming this component exists


function Router() {
  return (
    <Switch>
      <Route path="/" component={RootPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/scout" component={ScoutDashboard} />
      <ProtectedRoute path="/talent/register" component={TalentRegistration} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;