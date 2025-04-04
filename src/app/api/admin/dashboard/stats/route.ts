import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { QuidaxServerService } from '@/lib/quidax';

interface AdminRole {
  name: string;
}

interface AdminData {
  admin_roles: AdminRole;
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;

    if (!quidaxSecretKey) {
      console.error('QUIDAX_SECRET_KEY not configured');
      return NextResponse.json({ 
        error: 'Service configuration error',
        details: 'Missing API key'
      }, { status: 500 });
    }

    // Get session to verify admin status
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify admin status using admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        admin_roles (
          name
        )
      `)
      .eq('user_id', session.user.id)
      .single() as { data: AdminData | null; error: any };

    if (adminError || !adminData?.admin_roles) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();
    if (!['admin', 'super_admin'].includes(role)) {
      return new NextResponse('Invalid admin role', { status: 403 });
    }

    // Initialize Quidax service
    const quidax = new QuidaxServerService(quidaxSecretKey);

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString();

    try {
      // Fetch data in parallel
      const [
        usersResponse,
        walletsResponse,
        swapTransactionsResponse,
        marketDataResponse
      ] = await Promise.all([
        // Get all sub-accounts from Quidax
        quidax.request('/users').catch(error => {
          console.error('Error fetching users:', error);
          return { data: [] };
        }),
        // Get all wallets from Quidax
        quidax.request('/users/me/wallets').catch(error => {
          console.error('Error fetching wallets:', error);
          return { data: [] };
        }),
        // Get swap transactions
        quidax.request('/users/me/swap_transactions').catch(error => {
          console.error('Error fetching swap transactions:', error);
          return { data: [] };
        }),
        // Get market data
        quidax.request('/markets/tickers').catch(error => {
          console.error('Error fetching market data:', error);
          return { data: {} };
        })
      ]);

      // Calculate total users and active users
      const totalUsers = usersResponse.data?.length || 0;
      const activeUsers = usersResponse.data?.filter((user: any) => 
        new Date(user.updated_at) >= new Date(thirtyDaysAgo)
      ).length || 0;

      // Calculate total wallet balance
      const totalWalletBalance = walletsResponse.data?.reduce((sum: number, wallet: any) => {
        return sum + parseFloat(wallet.balance || 0);
      }, 0) || 0;

      // Calculate total revenue (1.4% of total wallet balance goes to Quidax)
      const quidaxFee = totalWalletBalance * 0.014;
      const totalRevenue = totalWalletBalance - quidaxFee;

      // Calculate daily transactions
      const todayTransactions = swapTransactionsResponse.data?.filter((tx: any) => 
        new Date(tx.created_at) >= new Date(today)
      ) || [];

      const totalDailyTransactions = todayTransactions.length;
      const dailyTransactionVolume = todayTransactions.reduce((sum: number, tx: any) => 
        sum + parseFloat(tx.from_amount || 0), 0);

      return NextResponse.json({
        totalUsers,
        activeUsers,
        totalRevenue,
        totalWalletBalance,
        totalTransactions: totalDailyTransactions,
        dailyTransactionVolume,
      });

    } catch (error) {
      console.error('Error fetching Quidax data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Quidax data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 