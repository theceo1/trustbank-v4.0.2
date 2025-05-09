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
    const feeRes = await fetch(`${process.env.BASE_URL}/api/config/fees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'ngn' })
    });
    const feeData = await feeRes.json();
    if (!feeRes.ok || feeData.error) {
      return NextResponse.json({ error: feeData.error || 'Failed to fetch fee config' }, { status: 500 });
    }
    // New fee structure:
    // Korapay Fee: 1.5% of deposit
    // VAT: 7.5% of Korapay fee (prefer Korapay API, else calculate)
    // trustBank Markup: greater of (7% of deposit) OR (₦200 + 3% of deposit)
    const korapay_fee = +(Number(amount) * 0.015).toFixed(2);
    const trustbank_fee_option1 = Number(amount) * 0.07;
    const trustbank_fee_option2 = 200 + (Number(amount) * 0.03);
    const trustbank_fee = Math.max(trustbank_fee_option1, trustbank_fee_option2);
    // Prefer VAT from Korapay API, else calculate
    let vat = korapayData.data?.fees?.vat ?? korapayData.data?.vat;
    if (vat === undefined || vat === null) {
      vat = +(korapay_fee * 0.075).toFixed(2);
    }

    // LOG: Show extracted backend-calculated fees
    console.log('[DEBUG][BACKEND FEE STRUCTURE]', { korapay_fee, trustbank_fee, vat });

    // Calculate new fee structure for frontend
    const service_fee = trustbank_fee + korapay_fee;
    const total_fee = service_fee + vat;
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
