import { Link } from "wouter";
import AdminLayout from "@/components/shared/AdminLayout";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <Link href="/admin">
            <a className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              Back to Admin
            </a>
          </Link>
        </div>
        
        <div className="w-full border rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 bg-white">
            <AnalyticsDashboard />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}