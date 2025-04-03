import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { DashboardCards } from '@/components/admin/DashboardCards';
import { RevenueMetrics } from '@/components/admin/RevenueMetrics';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader />
      <DashboardCards />
      <RevenueMetrics />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <AnalyticsCharts className="col-span-4" />
        <RecentActivity className="col-span-3" />
      </div>
    </div>
  );
} 