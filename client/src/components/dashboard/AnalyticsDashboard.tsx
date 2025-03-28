import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "../ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";

interface AnalyticsData {
  id: number;
  date: string;
  uploads: number;
  views: number;
  qrScans: number;
  approved: number;
  rejected: number;
  archived: number;
}

interface ChartData {
  date: string;
  Uploads: number;
  "QR Scans": number;
  Views: number;
  Approved: number;
  Rejected: number;
  Archived: number;
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get daily analytics for today's stats
  const dailyQuery = useQuery({
    queryKey: ['/api/analytics/daily'],
    queryFn: async () => {
      const url = '/api/analytics/daily';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Error fetching daily analytics: ${response.status}`);
      }
      return await response.json();
    },
  });
  
  // Get analytics data for the chart with date range
  const analyticsQuery = useQuery({
    queryKey: ['/api/analytics', dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      let url = '/api/analytics';
      const params = new URLSearchParams();
      
      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Error fetching analytics: ${response.status}`);
      }
      return await response.json();
    },
    enabled: !!dateRange,
  });
  
  const dailyData = dailyQuery.data as AnalyticsData | undefined;
  const analyticsData = analyticsQuery.data as AnalyticsData[] | undefined;
  
  // Transform data for the chart
  const chartData: ChartData[] = analyticsData?.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    Uploads: item.uploads,
    "QR Scans": item.qrScans,
    Views: item.views,
    Approved: item.approved,
    Rejected: item.rejected,
    Archived: item.archived
  })) || [];
  
  // Get total stats
  const totalUploads = analyticsData?.reduce((sum, item) => sum + item.uploads, 0) || 0;
  const totalViews = analyticsData?.reduce((sum, item) => sum + item.views, 0) || 0;
  const totalQrScans = analyticsData?.reduce((sum, item) => sum + item.qrScans, 0) || 0;
  const totalApproved = analyticsData?.reduce((sum, item) => sum + item.approved, 0) || 0;
  const totalRejected = analyticsData?.reduce((sum, item) => sum + item.rejected, 0) || 0;
  const totalArchived = analyticsData?.reduce((sum, item) => sum + item.archived, 0) || 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyQuery.isLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="text-2xl font-bold">{dailyData?.uploads || 0}</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's QR Scans</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyQuery.isLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="text-2xl font-bold">{dailyData?.qrScans || 0}</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's Views</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyQuery.isLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="text-2xl font-bold">{dailyData?.views || 0}</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>
                Analytics data for the selected date range
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {analyticsQuery.isLoading ? (
                <div className="flex items-center justify-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Total Uploads</div>
                      <div className="text-xl font-semibold">{totalUploads}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Total Views</div>
                      <div className="text-xl font-semibold">{totalViews}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Total QR Scans</div>
                      <div className="text-xl font-semibold">{totalQrScans}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Approved</div>
                      <div className="text-xl font-semibold">{totalApproved}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Rejected</div>
                      <div className="text-xl font-semibold">{totalRejected}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Archived</div>
                      <div className="text-xl font-semibold">{totalArchived}</div>
                    </div>
                  </div>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Uploads" fill="#8884d8" />
                        <Bar dataKey="QR Scans" fill="#82ca9d" />
                        <Bar dataKey="Views" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submission Statistics</CardTitle>
              <CardDescription>
                Analytics data for uploads and moderation actions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {analyticsQuery.isLoading ? (
                <div className="flex items-center justify-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Uploads" fill="#8884d8" />
                      <Bar dataKey="Approved" fill="#82ca9d" />
                      <Bar dataKey="Rejected" fill="#ff8042" />
                      <Bar dataKey="Archived" fill="#0088fe" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
              <CardDescription>
                Analytics data for user engagement with the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {analyticsQuery.isLoading ? (
                <div className="flex items-center justify-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="QR Scans" fill="#82ca9d" />
                      <Bar dataKey="Views" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}