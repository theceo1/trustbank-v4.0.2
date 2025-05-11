import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import crypto from 'crypto';

// Util: Validate Korapay webhook signature
function validateKorapaySignature(req: NextApiRequest, secretKey: string): boolean {
  const signature = req.headers['x-korapay-signature'] as string;
  if (!signature || !secretKey) return false;
  // Only hash the data object
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(JSON.stringify(req.body.data))
    .digest('hex');
  return hash === signature;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // Immediately acknowledge receipt for retry safety
  res.status(200).json({ status: 'received' });

  // Validate webhook signature using your KORAPAY_SECRET_KEY
  const secretKey = process.env.KORAPAY_SECRET_KEY;
  if (!validateKorapaySignature(req, secretKey!)) {
    console.warn('Invalid Korapay webhook signature');
    return;
  }

  try {
    // 1. Parse Korapay webhook payload
    const { reference, amount, account_number, customer } = req.body.data || {};
    const user_id = customer?.reference || customer?.id;
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
      // Not found or already processed, just log and exit
      return;
    }

    // 3. Mark as paid (update status or trigger Quidax swap as needed)
    await supabase
      .from('swap_transactions')
      .update({ status: 'payment_received', metadata: { ...trade.metadata, korapay: req.body } })
      .eq('id', trade.id);
    // Optionally, trigger Quidax swap here
    // ...
    // No further response needed, already acknowledged
  } catch (error: any) {
    console.error('Korapay webhook error:', error.message);
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
