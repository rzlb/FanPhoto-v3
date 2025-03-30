import AdminLayout from "@/components/shared/AdminLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import QrCodeCard from "@/components/dashboard/QrCodeCard";
import RecentUploads from "@/components/dashboard/RecentUploads";

export default function DashboardPage() {
  return (
    <AdminLayout>
      <div className="py-6">
        <div className="content-container">
          <h1 className="text-2xl font-semibold text-foreground mb-6">Dashboard</h1>
          <DashboardStats />
          <QrCodeCard />
          <RecentUploads />
        </div>
      </div>
    </AdminLayout>
  );
}
