// src/app/api/payments/korapay/bank-transfer/preview.ts
import { NextRequest, NextResponse } from 'next/server';


const KORAPAY_API_URL = 'https://api.korapay.com/merchant/api/v1/charges/bank-transfer';
const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { amount, account_name, customer } = body;
  if (!amount || !account_name || !customer?.name || !customer?.email) {
    return NextResponse.json({ error: 'Missing required fields: amount, account_name, customer.name, customer.email' }, { status: 400 });
  }

  // Use a unique reference for preview, but do NOT initiate a real charge if Korapay supports preview
  const reference = `tb-preview-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  try {
    // Call Korapay API for fee calculation/preview
    const korapayRes = await fetch(KORAPAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        account_name,
        amount,
        currency: 'NGN',
        reference,
        customer,
      }),
    });
    const korapayData = await korapayRes.json();
    // Log the raw Korapay API response
    // eslint-disable-next-line no-console
    console.log('[KORAPAY PREVIEW RAW]', JSON.stringify(korapayData, null, 2));

    // Use korapay fee and vat directly from API
    const korapay_fee = korapayData.data?.fee ?? 0;
    const vat = korapayData.data?.vat ?? 0;
    // Calculate trustBank markup only
    const markupPercent = parseFloat(process.env.TRUSTBANK_MARKUP_PERCENT || '0.025');
    const trustbank_fee = Number(amount) * markupPercent;
    const total_fee = trustbank_fee + korapay_fee + vat;
    const you_receive = Number(amount) - total_fee;

    return NextResponse.json({
      ...korapayData.data,
      trustbank_fee,
      korapay_fee,
      vat,
      total_fee,
      you_receive,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch Korapay preview' }, { status: 500 });
  }
}

