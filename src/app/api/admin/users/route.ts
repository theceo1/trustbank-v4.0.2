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

interface QuidaxTransaction {
  id: string;
  volume: string;
  status: string;
  created_at: string;
}

interface QuidaxWallet {
  id: string;
  currency: string;
  balance: string;
}

interface QuidaxUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TransformedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalTransactions: number;
  totalVolume: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalWallets: number;
  totalBalance: number;
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
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    try {
      // Fetch all sub-accounts
      const usersResponse = await quidax.request('/sub_accounts');
      const users = usersResponse.data || [];

      // Create a map to store user transactions
      const userTransactions = new Map();

      // Fetch transactions for each user
      await Promise.all(
        users.map(async (user: QuidaxUser) => {
          try {
            const transactionsResponse = await quidax.request(`/users/${user.id}/trades`);
            userTransactions.set(user.id, transactionsResponse.data || []);
          } catch (error) {
            console.error(`Error fetching transactions for user ${user.id}:`, error);
            userTransactions.set(user.id, []);
          }
        })
      );

      // Transform and filter users
      let transformedUsers = await Promise.all(
        users.map(async (user: QuidaxUser) => {
          const transactions = userTransactions.get(user.id) || [];
          const totalTransactions = transactions.length;
          const totalVolume = transactions.reduce(
            (sum: number, tx: QuidaxTransaction) => sum + parseFloat(tx.volume || '0'),
            0
          );
          const successfulTransactions = transactions.filter(
            (tx: QuidaxTransaction) => tx.status === 'success'
          ).length;
          const failedTransactions = transactions.filter(
            (tx: QuidaxTransaction) => tx.status === 'failed'
          ).length;

          try {
            const walletsResponse = await quidax.request(`/users/${user.id}/wallets`);
            const wallets = walletsResponse.data || [];
            const totalWallets = wallets.length;
            const totalBalance = wallets.reduce(
              (sum: number, wallet: QuidaxWallet) =>
                sum + parseFloat(wallet.balance || '0'),
              0
            );

            return {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              phone: user.phone,
              status: user.status,
              createdAt: user.created_at,
              updatedAt: user.updated_at,
              totalTransactions,
              totalVolume,
              successfulTransactions,
              failedTransactions,
              totalWallets,
              totalBalance,
            };
          } catch (error) {
            console.error(`Error fetching wallets for user ${user.id}:`, error);
            return {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              phone: user.phone,
              status: user.status,
              createdAt: user.created_at,
              updatedAt: user.updated_at,
              totalTransactions,
              totalVolume,
              successfulTransactions,
              failedTransactions,
              totalWallets: 0,
              totalBalance: 0,
            };
          }
        })
      );

      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase();
        transformedUsers = transformedUsers.filter((user: any) => 
          user.email.toLowerCase().includes(searchLower) ||
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.id.toLowerCase().includes(searchLower)
        );
      }

      if (status && status !== 'all') {
        transformedUsers = transformedUsers.filter((user: any) => 
          user.status.toLowerCase() === status.toLowerCase()
        );
      }

      // Sort users by creation date (newest first)
      transformedUsers.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Calculate statistics
      const stats = {
        totalUsers: transformedUsers.length,
        activeUsers: transformedUsers.filter((u: TransformedUser) => u.status === 'active').length,
        inactiveUsers: transformedUsers.filter((u: TransformedUser) => u.status === 'inactive').length,
        pendingUsers: transformedUsers.filter((u: TransformedUser) => u.status === 'pending').length,
        totalTransactions: users.length,
        totalVolume: users.reduce((sum: number, user: any) => sum + user.totalVolume, 0),
        averageTransactionVolume: users.length > 0 
          ? users.reduce((sum: number, user: any) => sum + user.totalVolume, 0) / users.length 
          : 0
      };

      return NextResponse.json({
        users: transformedUsers,
        stats,
        pagination: {
          total: transformedUsers.length,
          page: 1,
          perPage: transformedUsers.length
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}