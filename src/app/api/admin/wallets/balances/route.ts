import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Permission } from '@/lib/rbac';

interface AdminRole {
  name: string;
  permissions: Permission[];
}

interface AdminData {
  admin_roles: AdminRole;
}

interface QuidaxWallet {
  currency: string;
  balance: string;
  locked_balance: string;
  pending_balance: string;
}

const QUIDAX_API_URL = process.env.QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY!;

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role and permissions
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

    // Check if user is admin and has MANAGE_WALLET permission
    if (adminError || 
        !adminData?.admin_roles?.name || 
        !['admin', 'super_admin'].includes(adminData.admin_roles.name.toLowerCase()) ||
        (!adminData.admin_roles.permissions?.includes(Permission.ALL) && 
         !adminData.admin_roles.permissions?.includes(Permission.MANAGE_WALLET))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all wallets from Quidax for the main account
    const walletsResponse = await fetch(`${QUIDAX_API_URL}/users/me/wallets`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!walletsResponse.ok) {
      throw new Error('Failed to fetch wallets from Quidax');
    }

    const walletsData = await walletsResponse.json();

    // Group balances by currency
    const balancesByCurrency = (walletsData.data as QuidaxWallet[]).reduce((acc: Record<string, number>, wallet) => {
      const currency = wallet.currency.toUpperCase();
      const balance = parseFloat(wallet.balance) || 0;
      
      if (!acc[currency]) {
        acc[currency] = 0;
      }
      acc[currency] += balance;
      
      return acc;
    }, {});

    // Format balances for response
    const formattedBalances = Object.entries(balancesByCurrency).map(([currency, balance]) => ({
      currency,
      balance: parseFloat(balance.toFixed(8)),
      percentage: 0, // Will be calculated below
      quidaxFee: parseFloat((balance * 0.014).toFixed(8)), // 1.4% Quidax fee
    }));

    // Sort balances by amount in descending order
    formattedBalances.sort((a, b) => b.balance - a.balance);

    // Calculate total balance and percentages
    const totalBalance = formattedBalances.reduce((sum, { balance }) => sum + balance, 0);
    formattedBalances.forEach(item => {
      item.percentage = parseFloat(((item.balance / totalBalance) * 100).toFixed(2));
    });

    return NextResponse.json({
      balances: formattedBalances,
      total: parseFloat(totalBalance.toFixed(8)),
      totalQuidaxFee: parseFloat((totalBalance * 0.014).toFixed(8)), // 1.4% of total balance
    });
  } catch (error) {
    console.error('Error in wallet balances endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 