import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/styled-card";
import { Camera, CheckCircle, Archive, Clock } from "lucide-react";

interface StatsResponse {
  totalUploads: number;
  approvedPhotos: number;
  pendingApproval: number;
  archivedPhotos: number;
}

export default function DashboardStats() {
  const { data, isLoading, error } = useQuery<StatsResponse>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(null).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-full mb-3" />
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-md">
        Error loading stats: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Uploads",
      value: data?.totalUploads || 0,
      icon: <Camera className="h-6 w-6 text-primary" />
    },
    {
      title: "Approved Photos",
      value: data?.approvedPhotos || 0,
      icon: <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
    },
    {
      title: "Archived Photos",
      value: data?.archivedPhotos || 0,
      icon: <Archive className="h-6 w-6 text-purple-600 dark:text-purple-500" />
    },
    {
      title: "Pending Approval",
      value: data?.pendingApproval || 0,
      icon: <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
    }
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}
