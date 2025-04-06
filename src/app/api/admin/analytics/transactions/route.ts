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

    // Fetch regular transactions
    const { data: regularTransactions, error: regularError } = await supabase
      .from('transactions')
      .select('status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (regularError) {
      throw new Error(`Failed to fetch regular transactions: ${regularError.message}`);
    }

    // Fetch swap transactions
    const { data: swapTransactions, error: swapError } = await supabase
      .from('swap_transactions')
      .select('status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (swapError) {
      throw new Error(`Failed to fetch swap transactions: ${swapError.message}`);
    }

    // Initialize data structures
    const monthlyStats = new Array(12).fill(null).map(() => ({
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      swaps: 0,
      regular: 0
    }));

    const labels = [];

    // Generate labels for the last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(endDate);
      date.setMonth(date.getMonth() - (11 - i));
      labels.push(date.toLocaleString('default', { month: 'short' }));
    }

    // Process regular transactions
    regularTransactions?.forEach((tx) => {
      if (!tx.created_at) return;
      
      const date = new Date(tx.created_at);
      const monthIndex = 11 - (endDate.getMonth() - date.getMonth() + (12 * (endDate.getFullYear() - date.getFullYear())));
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyStats[monthIndex].total++;
        monthlyStats[monthIndex].regular++;
        if (tx.status === 'completed') monthlyStats[monthIndex].successful++;
        else if (tx.status === 'failed') monthlyStats[monthIndex].failed++;
        else monthlyStats[monthIndex].pending++;
      }
    });

    // Process swap transactions
    swapTransactions?.forEach((tx) => {
      if (!tx.created_at) return;
      
      const date = new Date(tx.created_at);
      const monthIndex = 11 - (endDate.getMonth() - date.getMonth() + (12 * (endDate.getFullYear() - date.getFullYear())));
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyStats[monthIndex].total++;
        monthlyStats[monthIndex].swaps++;
        if (tx.status === 'completed') monthlyStats[monthIndex].successful++;
        else if (tx.status === 'failed') monthlyStats[monthIndex].failed++;
        else monthlyStats[monthIndex].pending++;
      }
    });

    // Calculate totals
    const totals = {
      total: monthlyStats.reduce((sum, month) => sum + month.total, 0),
      successful: monthlyStats.reduce((sum, month) => sum + month.successful, 0),
      failed: monthlyStats.reduce((sum, month) => sum + month.failed, 0),
      pending: monthlyStats.reduce((sum, month) => sum + month.pending, 0),
      swaps: monthlyStats.reduce((sum, month) => sum + month.swaps, 0),
      regular: monthlyStats.reduce((sum, month) => sum + month.regular, 0)
    };

    // Calculate success rate trend
    const successRates = monthlyStats.map(month => 
      month.total > 0 ? Number((month.successful / month.total * 100).toFixed(2)) : 0
    );

    return NextResponse.json({
      labels,
      monthlyStats,
      totals,
      successRates
    });

  } catch (error: any) {
    console.error('Analytics transactions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transaction analytics' },
      { status: 500 }
    );
  }
} 