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
  status: string;
  created_at: string;
}

interface QuidaxTransaction {
  id: string;
  from_amount: string;
  status: string;
  created_at: string;
}

interface DailyStats {
  date: string;
  transactions: number;
  volume: number;
  newUsers: number;
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

    // Get the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Initialize daily stats
    const dailyStats: { [key: string]: DailyStats } = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = {
        date: dateStr,
        transactions: 0,
        volume: 0,
        newUsers: 0
      };
    }

    // Process each user's data
    for (const user of allUsers) {
      try {
        // Count new users per day
        const userCreatedDate = new Date(user.created_at).toISOString().split('T')[0];
        if (dailyStats[userCreatedDate]) {
          dailyStats[userCreatedDate].newUsers++;
        }

        // Fetch and process user's transactions
        const transactionsResponse = await quidax.request(`/users/${user.id}/swap_transactions`);
        const transactions = transactionsResponse.data as QuidaxTransaction[];

        for (const tx of transactions) {
          const txDate = new Date(tx.created_at).toISOString().split('T')[0];
          if (dailyStats[txDate]) {
            dailyStats[txDate].transactions++;
            dailyStats[txDate].volume += parseFloat(tx.from_amount || '0');
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        // Continue with next user
      }
    }

    // Convert dailyStats object to array and sort by date
    const chartData = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      chartData: chartData.map(day => ({
        date: day.date,
        transactions: day.transactions,
        volume: day.volume,
        newUsers: day.newUsers
      }))
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
} 