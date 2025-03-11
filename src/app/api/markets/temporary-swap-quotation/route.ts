import { NextResponse } from 'next/server';

const QUIDAX_API_URL = 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

export async function POST(request: Request) {
  try {
    if (!QUIDAX_SECRET_KEY) {
      throw new Error('QUIDAX_SECRET_KEY is not configured');
    }

    const body = await request.json();
    const { userId, from_currency, to_currency, from_amount } = body;

    if (!userId || !from_currency || !to_currency || !from_amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${QUIDAX_API_URL}/users/${userId}/temporary_swap_quotation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        },
        body: JSON.stringify({
          from_currency,
          to_currency,
          from_amount,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to get swap quotation' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting swap quotation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 