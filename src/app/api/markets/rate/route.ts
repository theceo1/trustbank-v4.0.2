import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

type CurrencyPairs = {
  [key: string]: {
    [key: string]: number;
  };
};

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from')?.toUpperCase();
    const to = searchParams.get('to')?.toUpperCase();

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Define market rates (all in uppercase)
    const rates: CurrencyPairs = {
      'BTC': {
        'USDT': 0.000015625, // 1/64000
        'NGN': 126700000,
        'ETH': 18.285714286,
      },
      'ETH': {
        'USDT': 0.000285714, // 1/3500
        'NGN': 6930000,
        'BTC': 0.054687500,
      },
      'USDT': {
        'BTC': 0.000015625,
        'ETH': 0.000285714,
        'NGN': 1980,
      },
      'NGN': {
        'USDT': 0.000505051,
        'BTC': 0.000000007893,
        'ETH': 0.000000144300,
      }
    };

    // Try to get direct rate
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (rates[fromUpper]?.[toUpper]) {
      return NextResponse.json({ rate: rates[fromUpper][toUpper] });
    }

    // Try inverse rate
    if (rates[toUpper]?.[fromUpper]) {
      return NextResponse.json({ rate: 1 / rates[toUpper][fromUpper] });
    }

    // Try through USDT
    if (rates[fromUpper]?.['USDT'] && rates['USDT']?.[toUpper]) {
      const throughUsdt = rates[fromUpper]['USDT'] * rates['USDT'][toUpper];
      return NextResponse.json({ rate: throughUsdt });
    }

    // Try through NGN
    if (rates[fromUpper]?.['NGN'] && rates['NGN']?.[toUpper]) {
      const throughNgn = rates[fromUpper]['NGN'] * rates['NGN'][toUpper];
      return NextResponse.json({ rate: throughNgn });
    }

    return NextResponse.json(
      { error: 'Rate not available for this pair' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching market rate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 