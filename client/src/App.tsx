import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import UploadPage from "@/pages/upload";
import DashboardPage from "@/pages/admin/dashboard";
import ModerationPage from "@/pages/admin/moderation";
import ArchivedPage from "@/pages/admin/archived";
import DisplaySettingsPage from "@/pages/admin/display-settings";
import AnalyticsPage from "@/pages/admin/analytics";
import DisplayPage from "@/pages/display";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={UploadPage} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/display" component={DisplayPage} />
      
      {/* Admin routes */}
      <Route path="/admin" component={DashboardPage} />
      <Route path="/admin/dashboard" component={DashboardPage} />
      <Route path="/admin/moderation" component={ModerationPage} />
      <Route path="/admin/archived" component={ArchivedPage} />
      <Route path="/admin/display-settings" component={DisplaySettingsPage} />
      <Route path="/admin/analytics" component={AnalyticsPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;