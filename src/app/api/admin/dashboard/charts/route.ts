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

    // Get last 6 months of data
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      return {
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString()
      };
    }).reverse();

    try {
      // Fetch all historical data in parallel
      const [usersResponse, swapTransactionsResponse, walletsResponse] = await Promise.all([
        quidax.request('/users'),
        quidax.request('/users/me/swap_transactions'),
        quidax.request('/users/me/wallets')
      ]);

      // Process revenue data (from swap transactions)
      const revenueData = months.map(month => {
        const monthTransactions = swapTransactionsResponse.data?.filter((tx: any) => {
          const txDate = new Date(tx.created_at);
          return txDate >= new Date(month.start) && txDate < new Date(month.end);
        }) || [];

        const totalVolume = monthTransactions.reduce((sum: number, tx: any) => 
          sum + parseFloat(tx.from_amount || 0), 0);

        // Calculate revenue (total volume minus Quidax's 1.4% fee)
        const revenue = totalVolume * 0.986;

        return {
          name: month.label,
          Revenue: revenue
        };
      });

      // Process new users data
      const usersData = months.map(month => {
        const monthUsers = usersResponse.data?.filter((user: any) => {
          const createdAt = new Date(user.created_at);
          return createdAt >= new Date(month.start) && createdAt < new Date(month.end);
        }) || [];

        return {
          name: month.label,
          'New Users': monthUsers.length
        };
      });

      // Process wallet data
      const walletsData = months.map(month => {
        const monthWallets = walletsResponse.data?.filter((wallet: any) => {
          const createdAt = new Date(wallet.created_at);
          return createdAt >= new Date(month.start) && createdAt < new Date(month.end);
        }) || [];

        const totalBalance = monthWallets.reduce((sum: number, wallet: any) => 
          sum + parseFloat(wallet.balance || 0), 0);

        return {
          name: month.label,
          'Total Balance': totalBalance
        };
      });

      // Calculate transaction volume (80% of revenue)
      const transactionVolumeData = revenueData.map(r => ({
        name: r.name,
        Volume: r.Revenue * 0.8
      }));

      return NextResponse.json({
        revenue: revenueData,
        users: usersData,
        wallets: walletsData,
        transactionVolume: transactionVolumeData
      });

    } catch (error) {
      console.error('Error fetching Quidax data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Quidax data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 