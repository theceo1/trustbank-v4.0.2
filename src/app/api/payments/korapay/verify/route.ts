import { NextResponse } from 'next/server';
import { korapayService } from '@/lib/services/korapay';

interface KorapayResponse {
  status: boolean;
  message?: string;
  data: {
    account_name: string;
    account_number: string;
    bank_name: string;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bankCode, accountNumber } = body;

    if (!bankCode || !accountNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure account number is 10 digits
    if (accountNumber.length !== 10) {
      return NextResponse.json(
        { error: 'Account number must be 10 digits' },
        { status: 400 }
      );
    }

    // Ensure bank code is valid
    if (!/^\d{3}$/.test(bankCode)) {
      return NextResponse.json(
        { error: 'Invalid bank code format' },
        { status: 400 }
      );
    }

    const response = await korapayService.verifyAccount(bankCode, accountNumber) as KorapayResponse;

    if (!response.status) {
      console.error('Account verification failed:', response);
      return NextResponse.json(
        { error: response.message || 'Failed to verify account' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: {
        account_name: response.data.account_name,
        account_number: response.data.account_number,
        bank_name: response.data.bank_name,
      },
    });
  } catch (error) {
    console.error('Account verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify account' },
      { status: 500 }
    );
  }
} 