import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { DashboardCards } from '@/components/admin/DashboardCards';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <DashboardHeader />
      <DashboardCards />
      <div className="grid gap-8 md:grid-cols-2">
        <RecentActivity />
        <AnalyticsCharts />
      </div>
    </div>
  );
} 