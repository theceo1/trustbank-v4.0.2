import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { QuidaxService } from '@/lib/quidax';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(authHeader.split(' ')[1]);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from('p2p_disputes')
      .select('*, trade:p2p_trades(*)')
      .eq('id', params.id)
      .single();

    if (disputeError || !dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    // Verify dispute status
    if (dispute.status !== 'pending') {
      return NextResponse.json({ error: 'Dispute is not pending' }, { status: 400 });
    }

    // Initialize Quidax service
    const quidax = new QuidaxService(process.env.QUIDAX_API_URL, process.env.QUIDAX_SECRET_KEY);

    // Return funds to seller (reject dispute)
    const escrowResponse = await quidax.transferToSubAccount(process.env.QUIDAX_ESCROW_WALLET_ID!, {
      currency: dispute.trade.currency,
      amount: dispute.trade.amount.toString(),
      fund_uid: dispute.trade.seller_quidax_id,
      transaction_note: `P2P trade dispute rejected for trade ${dispute.trade_id}`,
      narration: 'P2P trade dispute rejected'
    });

    if (!escrowResponse.success) {
      return NextResponse.json({ error: 'Failed to transfer funds' }, { status: 500 });
    }

    // Update dispute status
    const { error: updateError } = await supabase
      .from('p2p_disputes')
      .update({
        status: 'rejected',
        admin_notes: reason,
        resolved_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update dispute status' }, { status: 500 });
    }

    // Update trade and escrow status
    const { error: tradeError } = await supabase
      .from('p2p_trades')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', dispute.trade_id);

    if (tradeError) {
      return NextResponse.json({ error: 'Failed to update trade status' }, { status: 500 });
    }

    const { error: escrowError } = await supabase
      .from('p2p_escrows')
      .update({
        status: 'completed'
      })
      .eq('id', dispute.trade.escrow_id);

    if (escrowError) {
      return NextResponse.json({ error: 'Failed to update escrow status' }, { status: 500 });
    }

    // Notify users
    // TODO: Implement notification system

    return NextResponse.json({
      success: true,
      data: {
        dispute_id: params.id,
        trade_id: dispute.trade_id,
        status: 'rejected'
      }
    });

  } catch (error) {
    console.error('P2P dispute rejection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 