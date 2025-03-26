import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Permission } from '@/lib/rbac';

interface AdminRole {
  permissions: Permission[];
}

interface AdminUser {
  admin_roles: AdminRole;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to approve transactions
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        admin_roles (
          permissions
        )
      `)
      .eq('user_id', session.user.id)
      .single() as { data: AdminUser | null, error: any };

    if (adminError || !adminData?.admin_roles?.permissions?.includes(Permission.APPROVE_TRANSACTION)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get action from request body
    const { action } = await request.json();
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', params.transactionId)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending transactions can be approved or rejected' },
        { status: 400 }
      );
    }

    // Start a transaction
    const { data, error: updateError } = await supabase.rpc('handle_transaction_approval', {
      p_transaction_id: params.transactionId,
      p_action: action,
      p_admin_id: session.user.id
    });

    if (updateError) {
      console.error('Error handling transaction:', updateError);
      return NextResponse.json(
        { error: 'Failed to process transaction' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('user_activities').insert({
      user_id: session.user.id,
      type: 'transaction_approval',
      description: `${action}ed transaction ${params.transactionId}`,
      metadata: {
        transaction_id: params.transactionId,
        action,
        admin_id: session.user.id
      }
    });

    return NextResponse.json({
      message: `Transaction ${action}ed successfully`,
      data
    });
  } catch (error) {
    console.error('Error in transaction action endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 