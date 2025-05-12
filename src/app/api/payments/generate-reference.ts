import type { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This endpoint generates a unique, secure payment reference for Korapay
// Stores the reference in the DB for reconciliation and webhook verification

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, email } = req.body;
    if (!amount || !email) {
      return res.status(400).json({ error: 'Missing amount or email' });
    }
    // Generate a unique reference (prefix + nanoid + timestamp)
    const reference = `TRUSTBANK-${nanoid(10)}-${Date.now()}`;
    // Save to DB for later reconciliation
    const { error: insertError } = await supabase
      .from('korapay_references')
      .insert([
        {
          reference,
          amount,
          email,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ]);
    if (insertError) {
      return res.status(500).json({ error: 'Failed to store reference' });
    }
    return res.status(200).json({ reference });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate reference' });
  }
}
