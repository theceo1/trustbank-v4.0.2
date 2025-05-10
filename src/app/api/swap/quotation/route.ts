import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { from_currency, to_currency, from_amount } = await req.json();
    if (!from_currency || !to_currency || !from_amount) {
      return NextResponse.json({ status: 'error', error: 'Missing required fields' }, { status: 400 });
    }

    // Use Quidax API (temporary swap quote)
    const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;
    if (!QUIDAX_SECRET_KEY) {
      return NextResponse.json({ status: 'error', error: 'Quidax secret key not configured' }, { status: 500 });
    }

    // Use Quidax API (create instant swap quotation)
    // Only use 'me' on the server, never expose to frontend
    const apiRes = await fetch('https://www.quidax.com/api/v1/users/me/swap_quotation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        from_currency,
        to_currency,
        from_amount,
      }),
    });

    const data = await apiRes.json();
    // Return the Quidax response including the quotation id if present
    return NextResponse.json(data, { status: apiRes.status });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Failed to fetch swap quotation' }, { status: 500 });
  }
}
