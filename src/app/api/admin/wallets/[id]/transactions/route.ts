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
  type: string;
  amount: string;
  status: string;
  created_at: string;
  currency: string;
  transaction_type: string;
  reference: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;

    if (!quidaxSecretKey) {
      console.error('Missing QUIDAX_SECRET_KEY');
      return NextResponse.json({ 
        error: 'Service configuration error',
        details: 'Missing API key'
      }, { status: 500 });
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin permissions
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
      console.error('Admin verification error:', adminError);
      return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
    }

    const role = adminData.admin_roles.name.toLowerCase();
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 403 });
    }

    // Initialize Quidax service
    const quidax = createQuidaxServer(quidaxSecretKey);

    try {
      // Extract currency from the wallet ID
      const [currency] = params.id.split('-');
      if (!currency) {
        throw new Error('Invalid wallet ID format');
      }

      console.log('Fetching transactions for currency:', currency);

      // Fetch wallet transactions using the currency
      const response = await quidax.request(`/users/me/wallets/${currency}/transactions`, {
        method: 'GET',
        params: {
          limit: 10,
          order: 'desc'
        }
      });

      if (!response || !Array.isArray(response)) {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format from Quidax API');
      }

      const transactions = response as QuidaxTransaction[];

      return NextResponse.json({
        success: true,
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          status: tx.status,
          created_at: tx.created_at,
          currency: tx.currency,
          transaction_type: tx.transaction_type,
          reference: tx.reference
        }))
      });

    } catch (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 