import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createQuidaxServer } from '@/lib/quidax';
import { Permission } from '@/lib/rbac';

interface AdminRole {
  name: string;
  permissions: Permission[];
}

interface AdminData {
  admin_roles: AdminRole;
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
    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;

    if (!quidaxSecretKey) {
      console.error('QUIDAX_SECRET_KEY not configured');
      return NextResponse.json({ 
        error: 'Service configuration error',
        details: 'Missing API key'
      }, { status: 500 });
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role from admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        admin_roles (
          name,
          permissions
        )
      `)
      .eq('user_id', session.user.id)
      .single() as { data: AdminData | null, error: any };

    if (adminError || !adminData?.admin_roles) {
      return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();

    // Check if user has admin or super_admin role
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 403 });
    }

    // Initialize Quidax service
    const quidax = createQuidaxServer(quidaxSecretKey);

    // First, fetch all sub-accounts
    const allUsersResponse = await quidax.request('/users');
    const allUsers = allUsersResponse.data as QuidaxUser[];

    // Initialize aggregated data
    let totalUsers = 0;
    let activeUsers = 0;
    let totalTransactions = 0;
    let totalVolume = 0;
    let totalWallets = 0;
    let totalBalance = 0;
    let recentTransactions: any[] = [];

    // Process each user (including sub-accounts)
    for (const user of allUsers) {
      try {
        // Fetch user's wallets
        const walletsResponse = await quidax.request(`/users/${user.id}/wallets`);
        const wallets = walletsResponse.data as QuidaxWallet[];

        // Fetch user's transactions
        const transactionsResponse = await quidax.request(`/users/${user.id}/swap_transactions`);
        const transactions = transactionsResponse.data as QuidaxTransaction[];

        // Update statistics
        totalUsers++;
        if (user.status === 'active') activeUsers++;

        // Process wallets
        totalWallets += wallets.length;
        totalBalance += wallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance || '0'), 0);

        // Process transactions
        totalTransactions += transactions.length;
        totalVolume += transactions.reduce((sum, tx) => sum + parseFloat(tx.from_amount || '0'), 0);

        // Add recent transactions
        recentTransactions.push(...transactions.map(tx => ({
          id: tx.id,
          userId: user.id,
          userName: `${user.first_name} ${user.last_name}`,
          fromAmount: parseFloat(tx.from_amount || '0'),
          fromCurrency: tx.from_currency,
          status: tx.status,
          createdAt: tx.created_at,
        })));
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        // Continue with next user
      }
    }

    // Sort recent transactions by date and take the latest 10
    recentTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    recentTransactions = recentTransactions.slice(0, 10);

    // Calculate revenue (assuming 1% fee on transactions)
    const totalRevenue = totalVolume * 0.01;

    // Calculate average transaction volume
    const averageTransactionVolume = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalTransactions,
      totalVolume,
      totalWallets,
      totalBalance,
      totalRevenue,
      averageTransactionVolume,
      recentTransactions,
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 