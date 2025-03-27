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

interface AdminUserResponse {
  data: AdminData | null;
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if user has permission
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's permissions
    const { data: adminData } = await supabase
      .from('admin_users')
      .select(`
        admin_roles!inner (
          name,
          permissions
        )
      `)
      .eq('user_id', user.id)
      .single() as AdminUserResponse;

    if (!adminData?.admin_roles?.permissions?.includes(Permission.MANAGE_WALLET)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all transaction limits
    const { data: limits, error } = await supabase
      .from('transaction_limits')
      .select('*')
      .order('currency');

    if (error) throw error;

    return NextResponse.json(limits);
  } catch (error) {
    console.error('Error fetching transaction limits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction limits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if user has permission
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's permissions
    const { data: adminData } = await supabase
      .from('admin_users')
      .select(`
        admin_roles!inner (
          name,
          permissions
        )
      `)
      .eq('user_id', user.id)
      .single() as AdminUserResponse;

    if (!adminData?.admin_roles?.permissions?.includes(Permission.MANAGE_WALLET)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { currency, dailyLimit, singleTransactionLimit, requireApprovalAbove } = body;

    // Validate input
    if (!currency || !dailyLimit || !singleTransactionLimit || !requireApprovalAbove) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert transaction limit
    const { data, error } = await supabase
      .from('transaction_limits')
      .upsert({
        currency: currency.toUpperCase(),
        daily_limit: dailyLimit,
        single_transaction_limit: singleTransactionLimit,
        require_approval_above: requireApprovalAbove,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving transaction limit:', error);
    return NextResponse.json(
      { error: 'Failed to save transaction limit' },
      { status: 500 }
    );
  }
} 