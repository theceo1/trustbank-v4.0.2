//src/app/api/payments/korapay/bank-transfer/route.ts
import { NextRequest, NextResponse } from 'next/server';

// You should securely store your Korapay secret key in an environment variable
const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;
const KORAPAY_API_URL = 'https://api.korapay.com/merchant/api/v1/charges/bank-transfer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, account_name, customer } = body;
    if (!amount || !account_name || !customer?.name || !customer?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique reference for this deposit
    const reference = `tb-deposit-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

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
    console.log("Korapay API response:", JSON.stringify(korapayData, null, 2));
    if (!korapayData.status) {
      return NextResponse.json({ error: korapayData.message || 'Korapay error' }, { status: 500 });
    }

    // LOG: Show raw korapayData
    console.log('[DEBUG][KORAPAY RAW]', JSON.stringify(korapayData, null, 2));

    // Fetch trustBank fee config for this amount/currency
    // Use BASE_URL for server-side API calls (set BASE_URL in .env.local)
    const baseUrl = process.env.BASE_URL;
    console.log('[DEBUG][BASE_URL]', baseUrl);
    let feeData: any = null;
    let feeRes: Response | null = null;
    try {
      feeRes = await fetch(`${baseUrl}/api/config/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'ngn' })
      });
      const feeText = await feeRes.text();
      try {
        feeData = JSON.parse(feeText);
      } catch (jsonErr) {
        console.error('[ERROR][FEE API NON-JSON]', feeText);
        return NextResponse.json({ error: 'Fee API error: Non-JSON response', feeText }, { status: 500 });
      }
      if (!feeRes.ok || feeData.error) {
        return NextResponse.json({ error: feeData.error || 'Failed to fetch fee config' }, { status: 500 });
      }
    } catch (feeErr: any) {
      console.error('[ERROR][FEE FETCH FAILED]', feeErr);
      return NextResponse.json({ error: 'Fee fetch failed', details: feeErr?.message }, { status: 500 });
    }
    // New fee structure:
    // trustBank Markup: controlled by env (max/min percent)
    const markupPercent = parseFloat(process.env.TRUSTBANK_MARKUP_PERCENT || '0.025'); // 2.5% max
    const markupMinPercent = parseFloat(process.env.TRUSTBANK_MARKUP_MIN_PERCENT || '0.015'); // 1.5% min
    let trustbank_fee = Number(amount) * markupPercent;
    const markupMin = Number(amount) * markupMinPercent;
    if (trustbank_fee < markupMin) trustbank_fee = markupMin;
    const korapay_fee = korapayData.data?.fee ?? 0;
    let vat = korapayData.data?.fees?.vat ?? korapayData.data?.vat ?? 0;

    // LOG: Show extracted backend-calculated fees
    console.log('[DEBUG][BACKEND FEE STRUCTURE]', { korapay_fee, trustbank_fee, vat });

    // Calculate new fee structure for frontend
    const service_fee = trustbank_fee; // Only markup
    const total_fee = service_fee + korapay_fee + vat;
    const you_receive = Number(amount) - total_fee;

    // LOG: Show backend-calculated fees
    const backendResponse = {
      ...korapayData.data,
      trustbank_fee,
      korapay_fee,
      vat,
      service_fee, // trustbank_fee + korapay_fee
      total_fee,   // service_fee + vat
      you_receive,
    };
    console.log('[DEBUG][BACKEND RESPONSE]', JSON.stringify(backendResponse, null, 2));

    return NextResponse.json(backendResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
