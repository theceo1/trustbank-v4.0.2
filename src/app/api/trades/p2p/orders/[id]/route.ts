import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: order, error } = await supabase
      .from('p2p_orders')
      .select(`
        *,
        creator:profiles(
          name,
          completed_trades,
          completion_rate
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching P2P order:', error);
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch order' },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { status: 'error', message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error in P2P order route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const json = await request.json();
    const { status } = json;

    if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid status' },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('p2p_orders')
      .select('creator_id')
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { status: 'error', message: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.creator_id !== session.user.id) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: updatedOrder, error } = await supabase
      .from('p2p_orders')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating P2P order:', error);
      return NextResponse.json(
        { status: 'error', message: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'success', data: updatedOrder });
  } catch (error) {
    console.error('Error in P2P order route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 