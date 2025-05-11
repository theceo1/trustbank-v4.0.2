//src/app/api/swap/quotation/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { from_currency, to_currency, from_amount } = await req.json();
    console.log('[Swap Quotation] Incoming request:', { from_currency, to_currency, from_amount });
    // Log raw headers and method for frontend/script comparison
    console.log('[Swap Quotation] Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('[Swap Quotation] Request method:', req.method);
    // Log cookies
    try {
      const cookieHeader = req.headers.get('cookie');
      console.log('[Swap Quotation] Cookie header:', cookieHeader);
    } catch (e) {
      console.log('[Swap Quotation] Could not log cookie header:', e);
    }
    if (!from_currency || !to_currency || !from_amount) {
      console.error('[Swap Quotation] Missing required fields:', { from_currency, to_currency, from_amount });
      return NextResponse.json({ status: 'error', error: 'Missing required fields' }, { status: 400 });
    }

    // Authenticate user
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[Swap Quotation] Supabase user:', { user, authError });
    if (authError || !user) {
      console.error('[Swap Quotation] Unauthorized:', { authError });
      return NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch quidax_id from user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', user.id)
      .single();
    console.log('[Swap Quotation] User profile:', { profile, profileError });
    if (profileError || !profile?.quidax_id) {
      console.error('[Swap Quotation] User Quidax ID not found:', { userId: user.id, profileError });
      return NextResponse.json({ status: 'error', error: 'User Quidax ID not found' }, { status: 404 });
    }

    const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;
    if (!QUIDAX_SECRET_KEY) {
      console.error('[Swap Quotation] Quidax secret key not configured');
      return NextResponse.json({ status: 'error', error: 'Quidax secret key not configured' }, { status: 500 });
    }

    // Use Quidax API (create instant swap quotation)
    console.log('[Swap Quotation] Creating quotation for user:', { appUserId: user.id, quidaxId: profile.quidax_id });
    // Log payload sent to Quidax
    const quidaxPayload = { from_currency, to_currency, from_amount };
    console.log('[Swap Quotation] Sending to Quidax:', {
      quidaxId: profile.quidax_id,
      payload: quidaxPayload
    });
    const apiRes = await fetch(`https://www.quidax.com/api/v1/users/${profile.quidax_id}/swap_quotation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(quidaxPayload),
    });

    const data = await apiRes.json();
    console.log('[Swap Quotation] Quidax API response:', { status: apiRes.status, data });
    if (!apiRes.ok) {
      console.error('[Swap Quotation] Quidax API error:', { status: apiRes.status, data });
    }
    return NextResponse.json(data, { status: apiRes.status });
  } catch (error) {
    console.error('[Swap Quotation] Unexpected error:', error);
    return NextResponse.json({ status: 'error', error: 'Failed to fetch swap quotation' }, { status: 500 });
  }
}


