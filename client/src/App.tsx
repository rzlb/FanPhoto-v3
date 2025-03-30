import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { EventProvider } from "./context/event-context";
import { ThemeProvider } from "./components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import UploadPage from "@/pages/upload";
import DashboardPage from "@/pages/admin/dashboard";
import ModerationPage from "@/pages/admin/moderation";
import DisplaySettingsPage from "@/pages/admin/display-settings";
import AnalyticsPage from "@/pages/admin/analytics";
import EventsPage from "@/pages/admin/events";
import DisplayPage from "@/pages/display";
import { AdminLayout } from "./components/layout/admin-layout";

// Create an AdminRoute component that wraps admin routes with AdminLayout
function AdminRoute({ component: Component, ...rest }: { component: React.ComponentType, path: string }) {
  return (
    <Route
      {...rest}
      component={(props: any) => (
        <AdminLayout>
          <Component {...props} />
        </AdminLayout>
      )}
    />
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={UploadPage} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/display" component={DisplayPage} />
      
      {/* Admin routes */}
      <AdminRoute path="/admin" component={DashboardPage} />
      <AdminRoute path="/admin/dashboard" component={DashboardPage} />
      <AdminRoute path="/admin/moderation" component={ModerationPage} />
      <AdminRoute path="/admin/display-settings" component={DisplaySettingsPage} />
      <AdminRoute path="/admin/analytics" component={AnalyticsPage} />
      <AdminRoute path="/admin/events" component={EventsPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <EventProvider>
          <div className="min-h-screen bg-background">
            <Router />
            <Toaster />
          </div>
        </EventProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;