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
}

interface QuidaxTransaction {
  id: string;
  from_amount: string;
  from_currency: string;
  to_currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  execution_price: string;
  user?: QuidaxUser;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    description: string;
    reference: string;
    destination: string;
    source: string;
    notes?: string;
  };
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

    // Get query parameters
    const searchParams = new URL(req.url).searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Fetch all sub-accounts first
    const { data: users } = await quidax.request('/users');

    // Fetch platform transactions (main account)
    const { data: platformTransactions } = await quidax.request('/users/me/swap_transactions');

    // Create array to store all transactions
    let allTransactions = [];

    // Add platform transactions
    allTransactions.push(...platformTransactions.map((tx: any) => ({
      ...tx,
      user: {
        id: 'platform',
        first_name: 'Platform',
        last_name: 'Account',
        email: 'platform@trustbank.com'
      }
    })));

    // Fetch transactions for each sub-account
    for (const user of users) {
      try {
        const { data: userTransactions } = await quidax.request(`/users/${user.id}/swap_transactions`);
        allTransactions.push(...userTransactions.map((tx: any) => ({
          ...tx,
          user
        })));
      } catch (error) {
        console.error(`Error fetching transactions for user ${user.id}:`, error);
      }
    }

    // Transform transactions
    let transactions = allTransactions.map((tx: any) => ({
      id: tx.id,
      type: 'swap',
      amount: parseFloat(tx.from_amount || '0'),
      currency: tx.from_currency,
      status: tx.status,
      userId: tx.user.id,
      userName: tx.user.id === 'platform' 
        ? 'Platform Account'
        : `${tx.user.first_name} ${tx.user.last_name}`,
      userEmail: tx.user.email,
      createdAt: tx.created_at,
      updatedAt: tx.updated_at,
      metadata: {
        description: `Swap ${tx.from_currency.toUpperCase()} to ${tx.to_currency.toUpperCase()}`,
        reference: tx.id,
        destination: tx.to_currency,
        source: tx.from_currency,
        notes: `Execution price: ${tx.execution_price}`
      }
    }));

    // Apply filters
    if (type) {
      transactions = transactions.filter((tx: Transaction) => tx.type.toLowerCase() === type.toLowerCase());
    }

    if (status) {
      transactions = transactions.filter((tx: Transaction) => tx.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const searchLower = search.toLowerCase();
      transactions = transactions.filter((tx: Transaction) => 
        tx.id.toLowerCase().includes(searchLower) ||
        tx.userName.toLowerCase().includes(searchLower) ||
        (tx.userEmail?.toLowerCase() || '').includes(searchLower) ||
        tx.metadata.reference.toLowerCase().includes(searchLower)
      );
    }

    if (from) {
      const fromDate = new Date(from);
      transactions = transactions.filter((tx: Transaction) => new Date(tx.createdAt) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      transactions = transactions.filter((tx: Transaction) => new Date(tx.createdAt) <= toDate);
    }

    // Sort transactions by date (newest first)
    transactions.sort((a: Transaction, b: Transaction) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate statistics for current period and previous period
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentPeriodTxs = transactions.filter((tx: Transaction) => 
      new Date(tx.createdAt) >= thirtyDaysAgo
    );
    const previousPeriodTxs = transactions.filter((tx: Transaction) => 
      new Date(tx.createdAt) >= sixtyDaysAgo && new Date(tx.createdAt) < thirtyDaysAgo
    );

    // Calculate current period stats
    const currentVolume = currentPeriodTxs.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
    const currentSuccessful = currentPeriodTxs.filter((tx: Transaction) => tx.status === 'completed').length;
    const currentFailed = currentPeriodTxs.filter((tx: Transaction) => tx.status === 'failed').length;
    const currentTotal = currentPeriodTxs.length;

    // Calculate previous period stats
    const previousVolume = previousPeriodTxs.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
    const previousSuccessful = previousPeriodTxs.filter((tx: Transaction) => tx.status === 'completed').length;
    const previousFailed = previousPeriodTxs.filter((tx: Transaction) => tx.status === 'failed').length;
    const previousTotal = previousPeriodTxs.length;

    // Calculate percentage changes
    const volumeChange = previousVolume === 0 ? 100 : ((currentVolume - previousVolume) / previousVolume) * 100;
    const successRateChange = previousTotal === 0 ? 0 : 
      ((currentSuccessful / currentTotal) - (previousSuccessful / previousTotal)) * 100;
    const failureRateChange = previousTotal === 0 ? 0 : 
      ((currentFailed / currentTotal) - (previousFailed / previousTotal)) * 100;

    const stats = {
      totalVolume: transactions.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0),
      successfulTransactions: transactions.filter((tx: Transaction) => tx.status === 'completed').length,
      failedTransactions: transactions.filter((tx: Transaction) => tx.status === 'failed').length,
      pendingTransactions: transactions.filter((tx: Transaction) => tx.status === 'pending').length,
      volumeChange: Math.round(volumeChange * 100) / 100,
      successRateChange: Math.round(successRateChange * 100) / 100,
      failureRateChange: Math.round(failureRateChange * 100) / 100
    };

    return NextResponse.json({
      transactions,
      stats,
      pagination: {
        total: transactions.length,
        page: 1,
        perPage: transactions.length
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
} 