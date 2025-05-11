import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin/manual override endpoint for payment confirmation
// POST { reference: string, admin_id: string, note?: string }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { reference, admin_id, note } = req.body;
    if (!reference || !admin_id) {
      return res.status(400).json({ status: 'error', message: 'Missing reference or admin_id' });
    }

    // Find the pending or user_marked_paid trade by reference
    const { data: trade, error: tradeError } = await supabase
      .from('swap_transactions')
      .select('*')
      .in('status', ['pending', 'user_marked_paid'])
      .eq('reference', reference)
      .single();
    if (tradeError || !trade) {
      return res.status(404).json({ status: 'error', message: 'No pending trade found' });
    }

    // Update status to payment_received and record admin action
    const { error: updateError } = await supabase
      .from('swap_transactions')
      .update({
        status: 'payment_received',
        metadata: {
          ...trade.metadata,
          admin_manual_confirmed: true,
          admin_id,
          admin_note: note,
          admin_confirmed_at: new Date().toISOString(),
        },
      })
      .eq('id', trade.id);
    if (updateError) {
      return res.status(500).json({ status: 'error', message: 'Failed to update trade status' });
    }

    return res.status(200).json({ status: 'success', message: 'Trade manually confirmed as paid.' });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message || 'Server error' });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
