import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get the last 12 months of data
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 11);

    // Fetch revenue data
    const { data: revenueData, error: revenueError } = await supabase
      .from('platform_revenue')
      .select('amount, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (revenueError) {
      throw new Error(`Failed to fetch revenue data: ${revenueError.message}`);
    }

    // Fetch user growth data
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (userError) {
      throw new Error(`Failed to fetch user data: ${userError.message}`);
    }

    // Process revenue data by month
    const monthlyRevenue = new Array(12).fill(0);
    const monthlyUsers = new Array(12).fill(0);
    const labels = [];

    // Generate labels for the last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(endDate);
      date.setMonth(date.getMonth() - (11 - i));
      labels.push(date.toLocaleString('default', { month: 'short' }));
    }

    // Aggregate revenue data
    revenueData?.forEach((revenue) => {
      const date = new Date(revenue.created_at);
      const monthIndex = 11 - (endDate.getMonth() - date.getMonth() + (12 * (endDate.getFullYear() - date.getFullYear())));
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyRevenue[monthIndex] += Number(revenue.amount);
      }
    });

    // Aggregate user data
    userData?.forEach((user) => {
      const date = new Date(user.created_at);
      const monthIndex = 11 - (endDate.getMonth() - date.getMonth() + (12 * (endDate.getFullYear() - date.getFullYear())));
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyUsers[monthIndex]++;
      }
    });

    return NextResponse.json({
      labels,
      revenue: monthlyRevenue,
      users: monthlyUsers,
      totalRevenue: monthlyRevenue.reduce((a, b) => a + b, 0),
      totalUsers: monthlyUsers.reduce((a, b) => a + b, 0),
      averageRevenue: monthlyRevenue.reduce((a, b) => a + b, 0) / monthlyRevenue.filter(x => x > 0).length || 0,
      averageUsers: monthlyUsers.reduce((a, b) => a + b, 0) / monthlyUsers.filter(x => x > 0).length || 0
    });

  } catch (error: any) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
} 