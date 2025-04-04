import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { QuidaxServerService } from '@/lib/quidax';

type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'buy' | 'sell' | 'trade' | 'referral_bonus' | 'referral_commission';
type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface AdminRole {
  name: string;
}

interface AdminData {
  admin_roles: AdminRole;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface FormattedTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  description: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;

    if (!quidaxSecretKey) {
      console.error('QUIDAX_SECRET_KEY not configured');
      return NextResponse.json({ 
        error: 'Service configuration error',
        details: 'Missing API key'
      }, { status: 500 });
    }
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Admin transactions: Session check', {
      hasSession: !!session,
      userId: session?.user?.id,
      error: sessionError?.message
    });

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status using admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        admin_roles (
          name
        )
      `)
      .eq('user_id', session.user.id)
      .single() as { data: AdminData | null; error: any };

    if (adminError || !adminData?.admin_roles) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 403 });
    }

    // Initialize Quidax service
    const quidax = new QuidaxServerService(quidaxSecretKey);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    try {
      // Fetch all swap transactions
      const swapTransactionsResponse = await quidax.request('/users/me/swap_transactions');
      let transactions = swapTransactionsResponse.data || [];

      // Apply filters
      if (type && type !== 'all') {
        transactions = transactions.filter((tx: any) => tx.type === type);
      }
      if (status && status !== 'all') {
        transactions = transactions.filter((tx: any) => tx.status === status);
      }
      if (from && to) {
        transactions = transactions.filter((tx: any) => {
          const txDate = new Date(tx.created_at);
          return txDate >= new Date(from) && txDate <= new Date(to);
        });
      }
      if (search) {
        const searchLower = search.toLowerCase();
        transactions = transactions.filter((tx: any) => 
          tx.id.toLowerCase().includes(searchLower) ||
          tx.from_currency.toLowerCase().includes(searchLower) ||
          tx.to_currency.toLowerCase().includes(searchLower) ||
          tx.user?.email?.toLowerCase().includes(searchLower) ||
          tx.user?.first_name?.toLowerCase().includes(searchLower) ||
          tx.user?.last_name?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by created_at in descending order
      transactions.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Apply limit
      transactions = transactions.slice(0, limit);

      // Format transactions
      const formattedTransactions: FormattedTransaction[] = transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.type as TransactionType,
        amount: parseFloat(tx.from_amount),
        status: tx.status as TransactionStatus,
        userId: tx.user?.id || 'unknown',
        userName: tx.user ? `${tx.user.first_name} ${tx.user.last_name}` : 'Unknown User',
        userEmail: tx.user?.email || 'unknown@email.com',
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        description: `${tx.from_currency.toUpperCase()} to ${tx.to_currency.toUpperCase()} swap`
      }));

      return NextResponse.json({ transactions: formattedTransactions });
    } catch (error) {
      console.error('Error fetching Quidax transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in transactions endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 