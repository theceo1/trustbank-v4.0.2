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

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
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

    // Check if user has VIEW_TRANSACTIONS permission
    if (adminError || 
        !adminData?.admin_roles?.permissions || 
        (!adminData.admin_roles.permissions.includes(Permission.ALL) && 
         !adminData.admin_roles.permissions.includes(Permission.VIEW_TRANSACTIONS))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build the query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        user_profiles!transactions_user_id_fkey (
          user_id,
          full_name,
          email
        )
      `);

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(
        `user_profiles.email.ilike.%${search}%,user_profiles.full_name.ilike.%${search}%,reference.ilike.%${search}%`
      );
    }
    if (from && to) {
      query = query.gte('created_at', from).lte('created_at', to);
    }

    // Execute the query
    const { data: transactions, error: transactionsError } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      userId: transaction.user_profiles.user_id,
      userName: transaction.user_profiles.full_name,
      userEmail: transaction.user_profiles.email,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
      metadata: {
        description: transaction.description,
        reference: transaction.reference,
        destination: transaction.destination
      }
    }));

    return NextResponse.json({ transactions: transformedTransactions });
  } catch (error) {
    console.error('Error in transactions endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 