import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createQuidaxServer } from '@/lib/quidax';

interface AdminRole {
  name: string;
  permissions: string[];
}

interface AdminUser {
  admin_roles: AdminRole;
}

interface QuidaxTransaction {
  id: string;
  created_at: string;
  updated_at: string;
  confirmed: boolean;
  fee: string;
  fee_currency: string;
  price: string;
  total: string;
  volume: string;
  status: string;
  type: string;
  market: string;
  side: string;
}

interface QuidaxWallet {
  id: string;
  currency: string;
  balance: string;
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
      .single() as { data: AdminUser | null; error: any };

    if (adminError || !adminData?.admin_roles) {
      return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();

    // Check if user has admin or super_admin role
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 403 });
    }

    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;

    if (!quidaxSecretKey) {
      console.error('QUIDAX_SECRET_KEY not configured');
      return NextResponse.json({ 
        error: 'Service configuration error',
        details: 'Missing API key'
      }, { status: 500 });
    }

    const quidax = createQuidaxServer(quidaxSecretKey);

    try {
      // Fetch platform wallets
      const walletsResponse = await quidax.request('/wallets');
      const wallets = walletsResponse.data || [];

      // Fetch market tickers for price data
      const marketResponse = await quidax.request('/markets/tickers');
      const marketData = marketResponse.data || {};

      // Fetch transactions
      const transactionsResponse = await quidax.request('/trades');
      const transactions = transactionsResponse.data || [];

      // Calculate platform wallets with NGN values
      const platformWallets = await Promise.all(
        wallets.map(async (wallet: QuidaxWallet) => {
          try {
            if (wallet.currency === 'ngn') {
              return {
                currency: wallet.currency.toUpperCase(),
                balance: parseFloat(wallet.balance || '0'),
                value: parseFloat(wallet.balance || '0'),
              };
            }

            // Get market ticker for non-NGN currencies
            const marketTicker = marketData[`${wallet.currency}ngn`]?.ticker;
            const price = marketTicker ? parseFloat(marketTicker.last) : 0;

            return {
              currency: wallet.currency.toUpperCase(),
              balance: parseFloat(wallet.balance || '0'),
              value: parseFloat(wallet.balance || '0') * price,
            };
          } catch (error) {
            console.error(`Error processing wallet ${wallet.currency}:`, error);
            return {
              currency: wallet.currency.toUpperCase(),
              balance: 0,
              value: 0,
            };
          }
        })
      );

      // Calculate total volume and revenue
      const totalVolume = transactions.reduce((sum: number, tx: QuidaxTransaction) => {
        if (tx.status === 'confirmed') {
          return sum + parseFloat(tx.volume || '0');
        }
        return sum;
      }, 0);

      const quidaxRevenue = totalVolume * 0.014; // 1.4% fee
      const platformRevenue = 0; // No platform fee currently

      // Get previous month's transactions for growth calculation
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthTransactions = transactions.filter((tx: QuidaxTransaction) => {
        const txDate = new Date(tx.created_at);
        return txDate >= lastMonth && txDate < now;
      });

      const lastMonthVolume = lastMonthTransactions.reduce((sum: number, tx: QuidaxTransaction) => {
        if (tx.status === 'confirmed') {
          return sum + parseFloat(tx.volume || '0');
        }
        return sum;
      }, 0);

      const revenueGrowth = lastMonthVolume === 0 ? 0 : ((totalVolume - lastMonthVolume) / lastMonthVolume) * 100;

      // Generate monthly revenue distribution
      const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthTransactions = transactions.filter((tx: QuidaxTransaction) => {
          const txDate = new Date(tx.created_at);
          return txDate.getMonth() === month.getMonth() && txDate.getFullYear() === month.getFullYear();
        });

        const monthVolume = monthTransactions.reduce((sum: number, tx: QuidaxTransaction) => {
          if (tx.status === 'confirmed') {
            return sum + parseFloat(tx.volume || '0');
          }
          return sum;
        }, 0);

        return {
          month: month.toLocaleString('default', { month: 'short' }),
          total: monthVolume * 0.014,
          quidax: monthVolume * 0.014,
          platform: 0,
        };
      }).reverse();

      // Generate daily trade volume and revenue for last 30 days
      const tradeVolume = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayTransactions = transactions.filter((tx: QuidaxTransaction) => {
          const txDate = new Date(tx.created_at);
          return txDate.toDateString() === date.toDateString();
        });

        const dayVolume = dayTransactions.reduce((sum: number, tx: QuidaxTransaction) => {
          if (tx.status === 'confirmed') {
            return sum + parseFloat(tx.volume || '0');
          }
          return sum;
        }, 0);

        return {
          date: date.toISOString().split('T')[0],
          volume: dayVolume,
          revenue: dayVolume * 0.014,
        };
      }).reverse();

      return NextResponse.json({
        totalRevenue: quidaxRevenue + platformRevenue,
        quidaxRevenue,
        platformRevenue,
        revenueGrowth,
        platformWallets,
        monthlyRevenue,
        tradeVolume,
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch platform stats' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform stats' },
      { status: 500 }
    );
  }
}