import AdminLayout from "@/components/shared/AdminLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import QrCodeCard from "@/components/dashboard/QrCodeCard";
import RecentUploads from "@/components/dashboard/RecentUploads";

export default function DashboardPage() {
  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <DashboardStats />
          <QrCodeCard />
          <RecentUploads />
        </div>
      </div>
    </AdminLayout>
  );
}
