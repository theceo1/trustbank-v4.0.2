import { NextResponse } from 'next/server';
import { dojahService } from '@/lib/dojah';

export async function POST(request: Request) {
  try {
    // Debug: log env variables
    console.log('DOJAH_APP_ID:', process.env.DOJAH_APP_ID);
    console.log('DOJAH_API_KEY:', process.env.DOJAH_API_KEY);
    console.log('NEXT_PUBLIC_DOJAH_API_URL:', process.env.NEXT_PUBLIC_DOJAH_API_URL);

    const body = await request.json();
    const { bankCode, accountNumber } = body;

    if (!bankCode || !accountNumber) {
      console.log('Missing required fields', { bankCode, accountNumber });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only check account number is 10 digits
    if (accountNumber.length !== 10) {
      console.log('Account number not 10 digits:', accountNumber);
      return NextResponse.json(
        { error: 'Account number must be 10 digits' },
        { status: 400 }
      );
    }

    // Call Dojah for account name lookup
    const response = await dojahService.resolveBankAccount(bankCode, accountNumber);
    console.log('Dojah API response:', response);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to resolve account name' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error in verify API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 