import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { accountNumber, amount } = req.body;
    if (!accountNumber || !amount) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Find the pending trade for this account and amount
    const { data: trade, error: tradeError } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('status', 'pending')
      .eq('virtual_account_number', accountNumber)
      .eq('from_amount', amount)
      .single();
    if (tradeError || !trade) {
      return res.status(404).json({ status: 'error', message: 'No pending trade found' });
    }

    // Mark as user_marked_paid
    const { error: updateError } = await supabase
      .from('swap_transactions')
      .update({ status: 'user_marked_paid', metadata: { ...trade.metadata, user_marked_paid_at: new Date().toISOString() } })
      .eq('id', trade.id);
    if (updateError) {
      return res.status(500).json({ status: 'error', message: 'Failed to update trade status' });
    }

    return res.status(200).json({ status: 'success', message: 'Marked as paid. Awaiting verification.' });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message || 'Server error' });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
