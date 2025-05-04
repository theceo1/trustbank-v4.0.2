import { NextResponse } from 'next/server';
import { initiatePayout } from '@/lib/services/korapay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bankCode, accountNumber, amount, reference, customer } = body;

    // Validate required fields
    if (!bankCode || !accountNumber || !amount || !reference || !customer) {
      return NextResponse.json(
        { status: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate account number format (10 digits)
    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        { status: false, message: 'Invalid account number format' },
        { status: 400 }
      );
    }

    // Validate bank code format (3 digits)
    if (!/^\d{3}$/.test(bankCode)) {
      return NextResponse.json(
        { status: false, message: 'Invalid bank code format' },
        { status: 400 }
      );
    }

    // Validate amount (between NGN 1000 and NGN 10,000,000)
    if (amount < 1000 || amount > 10000000) {
      return NextResponse.json(
        { status: false, message: 'Amount must be between NGN 1,000 and NGN 10,000,000' },
        { status: 400 }
      );
    }

    // Process payout
    const result = await initiatePayout(
      amount,
      bankCode,
      accountNumber,
      customer,
      reference
    );

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      message: 'Payout initiated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { status: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 