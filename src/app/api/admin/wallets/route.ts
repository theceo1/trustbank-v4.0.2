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

interface QuidaxWallet {
  id: string;
  currency: string;
  balance: string;
  status?: string;
  created_at: string;
  updated_at: string;
  last_transaction_at?: string;
}

interface QuidaxUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface TransformedWallet {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currency: string;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastTransaction?: string;
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

    // Enhanced fetch with retry, timeout and error handling
    const enhancedFetch = async (url: string, options: { retries?: number; timeout?: number } = {}): Promise<any> => {
      const { retries = 3, timeout = 10000 } = options;
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await Promise.race([
            quidax.request(url, { signal: controller.signal }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
            )
          ]);
          
          clearTimeout(timeoutId);
          return response;
          
        } catch (error) {
          if (attempt === retries) {
            throw error;
          }
          
          // Log retry attempts
          console.warn(`Attempt ${attempt} failed for ${url}. Retrying...`, error);
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
      
      throw new Error(`All ${retries} attempts failed`);
    };

    // Get query parameters
    const searchParams = new URL(req.url).searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const currency = searchParams.get('currency')?.toLowerCase() || '';

    try {
      // Fetch all sub-accounts
      const usersResponse = await enhancedFetch('/sub_accounts', { 
        timeout: 15000,
        retries: 3
      });
      const users = usersResponse.data || [];

      // Fetch platform wallets
      const platformWalletsResponse = await enhancedFetch('/wallets', {
        timeout: 15000,
        retries: 3
      });
      const platformWallets = platformWalletsResponse.data || [];

      // Create array to store all wallets
      const allWallets: TransformedWallet[] = [];

      // Add platform wallets
      platformWallets.forEach((wallet: QuidaxWallet) => {
        allWallets.push({
          id: wallet.id,
          userId: 'platform',
          userName: 'Platform Account',
          userEmail: 'platform@trustbank.com',
          currency: wallet.currency,
          balance: parseFloat(wallet.balance || '0'),
          status: wallet.status || 'active',
          createdAt: wallet.created_at,
          updatedAt: wallet.updated_at,
          lastTransaction: wallet.last_transaction_at,
        });
      });

      // Fetch wallets for each user
      await Promise.all(
        users.map(async (user: QuidaxUser) => {
          try {
            const userWalletsResponse = await enhancedFetch(`/users/${user.id}/wallets`);
            const userWallets = userWalletsResponse.data || [];

            userWallets.forEach((wallet: QuidaxWallet) => {
              allWallets.push({
                id: wallet.id,
                userId: user.id,
                userName: `${user.firstName} ${user.lastName}`,
                userEmail: user.email,
                currency: wallet.currency,
                balance: parseFloat(wallet.balance || '0'),
                status: wallet.status || 'active',
                createdAt: wallet.created_at,
                updatedAt: wallet.updated_at,
                lastTransaction: wallet.last_transaction_at,
              });
            });
          } catch (error) {
            console.error(`Error fetching wallets for user ${user.id}:`, error);
          }
        })
      );

      // Filter wallets based on search and currency
      const filteredWallets = allWallets.filter((wallet) => {
        const matchesSearch = search
          ? wallet.userName.toLowerCase().includes(search) ||
            wallet.userEmail.toLowerCase().includes(search) ||
            wallet.currency.toLowerCase().includes(search)
          : true;

        const matchesCurrency = currency
          ? wallet.currency.toLowerCase() === currency
          : true;

        return matchesSearch && matchesCurrency;
      });

      // Sort wallets by balance in descending order
      const sortedWallets = filteredWallets.sort((a, b) => b.balance - a.balance);

      // Calculate statistics
      const stats = {
        totalWallets: sortedWallets.length,
        totalBalance: sortedWallets.reduce((sum, w) => sum + w.balance, 0),
        activeWallets: sortedWallets.filter((w) => w.status === 'active').length,
        inactiveWallets: sortedWallets.filter((w) => w.status === 'inactive').length,
        currencyDistribution: sortedWallets.reduce((acc: Record<string, { count: number; totalBalance: number }>, wallet) => {
          if (!acc[wallet.currency]) {
            acc[wallet.currency] = { count: 0, totalBalance: 0 };
          }
          acc[wallet.currency].count++;
          acc[wallet.currency].totalBalance += wallet.balance;
          return acc;
        }, {}),
      };

      return NextResponse.json({
        success: true,
        data: sortedWallets,
        stats,
        pagination: {
          total: sortedWallets.length,
          page: 1,
          perPage: sortedWallets.length,
        },
      });

    } catch (error) {
      console.error('Error in wallets API:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch wallet data',
          details: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Please try again later or contact support if the issue persists'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
} 