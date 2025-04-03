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

    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get previous month's start and end dates
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all wallets from Quidax
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
    
    // Fetch all sub-accounts from Quidax
    const subAccountsResponse = await fetch(`${QUIDAX_API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!subAccountsResponse.ok) {
      throw new Error('Failed to fetch sub-accounts from Quidax');
    }

    const subAccountsData = await subAccountsResponse.json();

    // Calculate statistics
    const totalBalance = walletsData.data.reduce((sum: number, wallet: any) => {
      return sum + parseFloat(wallet.balance || 0);
    }, 0);

    const activeWallets = subAccountsData.data.filter((account: any) => 
      account.status === 'active'
    ).length;

    const currentMonthAccounts = subAccountsData.data.filter((account: any) => {
      const createdAt = new Date(account.created_at);
      return createdAt >= startOfMonth && createdAt <= endOfMonth;
    });

    const prevMonthAccounts = subAccountsData.data.filter((account: any) => {
      const createdAt = new Date(account.created_at);
      return createdAt >= startOfPrevMonth && createdAt <= endOfPrevMonth;
    });

    const monthlyGrowth = prevMonthAccounts.length 
      ? ((currentMonthAccounts.length - prevMonthAccounts.length) / prevMonthAccounts.length) * 100 
      : 0;

    const response = {
      totalBalance: parseFloat(totalBalance.toFixed(8)),
      activeWallets,
      newWallets: currentMonthAccounts.length,
      monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2)),
      quidaxFee: parseFloat((totalBalance * 0.014).toFixed(8)), // 1.4% Quidax fee
      stats: {
        current: currentMonthAccounts.length,
        previous: prevMonthAccounts.length,
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in wallet stats endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}