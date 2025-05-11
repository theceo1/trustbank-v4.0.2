//src/app/api/payments/virtual-account-webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

// Initialize Supabase client (service role key for server-side ops)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Util: Call Quidax to execute the confirmed swap
async function executeQuidaxSwap(quotationId: string, quidaxId: string) {
  const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;
  if (!QUIDAX_SECRET_KEY) throw new Error('Quidax secret key not configured');

  const res = await fetch(`https://www.quidax.com/api/v1/users/${quidaxId}/swap_quotation/${quotationId}/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to execute Quidax swap');
  return data;
}

// Webhook endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    // 1. Parse payment notification from payment provider
    const { reference, amount, account_number, user_id } = req.body;
    if (!reference || !amount || !account_number || !user_id) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // 2. Find pending trade for this user & reference
    const { data: trade, error: tradeError } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .eq('reference', reference)
      .single();
    if (tradeError || !trade) {
      return res.status(404).json({ status: 'error', message: 'No pending trade found' });
    }

    // 3. Fetch user's quidax_id from user_profiles and execute Quidax swap
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', trade.user_id)
      .single();
    if (profileError || !profile?.quidax_id) {
      return res.status(404).json({ status: 'error', message: 'User Quidax ID not found' });
    }
    const quidaxResult = await executeQuidaxSwap(trade.quotation_id, profile.quidax_id);

    // 4. Credit user's crypto wallet (update status, record tx, etc.)
    const { error: updateError } = await supabase
      .from('swap_transactions')
      .update({ status: 'completed', metadata: { ...trade.metadata, quidaxResult } })
      .eq('id', trade.id);
    if (updateError) {
      return res.status(500).json({ status: 'error', message: 'Failed to update trade status' });
    }

    // 5. Optionally, credit user's crypto wallet in your own wallet table
    // ...

    return res.status(200).json({ status: 'success', message: 'Payment confirmed and crypto credited', quidaxResult });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message || 'Server error' });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
