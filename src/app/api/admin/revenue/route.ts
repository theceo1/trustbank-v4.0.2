import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface AdminRole {
  name: string;
  permissions: string[];
}

interface AdminData {
  admin_roles: AdminRole;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin access
    const cookieStore = cookies();
    const authClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session }, error: sessionError } = await authClient.auth.getSession();
    
    console.log('Admin revenue: Session check', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email
    });

    if (sessionError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
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

    console.log('Admin revenue: Role check', {
      adminData,
      adminError,
      userId: session.user.id
    });

    if (adminError || !adminData?.admin_roles) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get previous month's start and end dates
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch current month's revenue data
    const { data: currentMonthData, error: currentError } = await supabase
      .from('platform_revenue')
      .select('amount, fee_type')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());

    console.log('Admin revenue: Current month data', {
      data: currentMonthData,
      error: currentError,
      startDate: startOfMonth,
      endDate: endOfMonth
    });

    if (currentError) throw currentError;

    // Fetch previous month's revenue data for growth calculation
    const { data: prevMonthData, error: prevError } = await supabase
      .from('platform_revenue')
      .select('amount')
      .gte('created_at', startOfPrevMonth.toISOString())
      .lte('created_at', endOfPrevMonth.toISOString());

    console.log('Admin revenue: Previous month data', {
      data: prevMonthData,
      error: prevError,
      startDate: startOfPrevMonth,
      endDate: endOfPrevMonth
    });

    if (prevError) throw prevError;

    // Calculate revenue metrics
    const revenueBySource = {
      tradingFees: 0,
      swapFees: 0,
      transactionFees: 0,
    };

    let totalRevenue = 0;
    let platformFees = 0;
    let quidaxFees = 0;

    currentMonthData?.forEach((record) => {
      const amount = parseFloat(record.amount);
      totalRevenue += amount;

      switch (record.fee_type) {
        case 'TRADING':
          revenueBySource.tradingFees += amount;
          break;
        case 'SWAP':
          revenueBySource.swapFees += amount;
          break;
        case 'TRANSACTION':
          revenueBySource.transactionFees += amount;
          break;
      }

      // Calculate platform and Quidax fees
      platformFees += amount * 0.986; // 98.6% goes to platform
      quidaxFees += amount * 0.014;   // 1.4% goes to Quidax
    });

    // Calculate monthly growth
    const prevMonthTotal = prevMonthData?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0;
    const monthlyGrowth = prevMonthTotal === 0 ? 0 : ((totalRevenue - prevMonthTotal) / prevMonthTotal) * 100;

    const response = {
      totalRevenue,
      platformFees,
      quidaxFees,
      revenueBySource,
      monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2)),
    };

    console.log('Admin revenue: Response', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
} 