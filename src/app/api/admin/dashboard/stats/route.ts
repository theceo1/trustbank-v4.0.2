import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createQuidaxServer } from '@/lib/quidax';
import { Permission } from '@/lib/rbac';

interface AdminData {
  admin_roles: AdminRole;
  permissions: string[];
}

interface AdminRole {
  name: string;
  permissions: Permission[];
}

interface QuidaxUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
}

interface QuidaxWallet {
  currency: string;
  balance: string;
}

interface QuidaxTransaction {
  id: string;
  status: string;
  from_amount: string;
  from_currency: string;
  created_at: string;
  user: QuidaxUser;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify admin user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Quidax service with circuit breaker
    const quidax = createQuidaxServer();
    
    // Define fallback data
    const fallbackData = {
      totalUsers: 0,
      activeUsers: 0,
      totalTransactions: 0,
      totalVolume: 0,
      totalWallets: 0,
      totalBalance: 0,
      totalRevenue: 0,
      averageTransactionVolume: 0,
      recentTransactions: []
    };

    try {
      // Fetch all data in parallel with timeouts
      const [usersResponse, walletsResponse, transactionsResponse] = await Promise.allSettled([
        quidax.getSubAccounts(),
        quidax.getWallets('me'),
        quidax.getSwapTransactions('me')
      ]);

      // Process users
      const users = usersResponse.status === 'fulfilled' ? usersResponse.value : [];
      const activeUsers = users.filter(user => user.status === 'active').length;

      // Process wallets
      const wallets = walletsResponse.status === 'fulfilled' ? walletsResponse.value : [];
      const totalBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0);

      // Process transactions
      const transactions = transactionsResponse.status === 'fulfilled' ? transactionsResponse.value : [];
      const successfulTransactions = transactions.filter(tx => tx.status === 'completed');
      const totalVolume = successfulTransactions.reduce(
        (sum, tx) => sum + parseFloat(tx.from_amount),
        0
      );
      const avgTxVolume = successfulTransactions.length > 0 
        ? totalVolume / successfulTransactions.length 
        : 0;

      // Prepare recent transactions
      const recentTransactions = transactions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(tx => ({
          id: tx.id,
          amount: tx.from_amount,
          currency: tx.from_currency,
          status: tx.status,
          date: tx.created_at,
          user: tx.user
        }));

      return NextResponse.json({
        totalUsers: users.length,
        activeUsers,
        totalTransactions: transactions.length,
        totalVolume,
        totalWallets: wallets.length,
        totalBalance,
        totalRevenue: totalVolume * 0.01, // 1% fee estimate
        averageTransactionVolume: avgTxVolume,
        recentTransactions
      });

    } catch (error) {
      console.error('Partial Quidax API failure, using fallback for failed endpoints:', error);
      
      // Return partial data with fallback for failed endpoints
      return NextResponse.json({
        ...fallbackData,
        error: 'Partial data available - some API endpoints failed'
      });
    }

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}