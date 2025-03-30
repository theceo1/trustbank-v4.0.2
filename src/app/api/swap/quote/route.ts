import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { from_currency, to_currency, from_amount, user_id } = body;

    if (!from_currency || !to_currency || !from_amount || !user_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get market rate
    const rateResponse = await fetch(`${request.headers.get('origin')}/api/markets/rate?from=${from_currency}&to=${to_currency}`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!rateResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch market rate' },
        { status: rateResponse.status }
      );
    }

    const { rate } = await rateResponse.json();

    // Calculate amounts
    const to_amount = from_amount * rate;
    const ngn_equivalent = from_currency.toLowerCase() === 'ngn' 
      ? from_amount 
      : from_amount * (await getUsdtNgnRate(request));

    // Get user's 30-day trading volume
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: trades } = await supabase
      .from('trades')
      .select('amount, rate')
      .eq('user_id', session.user.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Calculate total trading volume in USD
    const tradingVolume = trades?.reduce((total, trade) => {
      return total + (parseFloat(trade.amount) * parseFloat(trade.rate));
    }, 0) || 0;

    // Calculate fees based on trading volume
    const feePercentage = getFeePercentage(tradingVolume);
    const totalFee = ngn_equivalent * feePercentage;
    const platformFee = totalFee / 2; // Split evenly
    const serviceFee = totalFee / 2;

    // Generate quote ID
    const quoteId = uuidv4();

    return NextResponse.json({
      id: quoteId,
      from_currency: from_currency.toUpperCase(),
      to_currency: to_currency.toUpperCase(),
      from_amount,
      to_amount,
      quoted_price: rate,
      fees: {
        platform: platformFee,
        service: serviceFee,
        total: totalFee
      },
      ngn_equivalent,
      expires_at: new Date(Date.now() + 15000).toISOString() // 15 seconds expiry
    });
  } catch (error) {
    console.error('Error creating swap quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getUsdtNgnRate(request: Request): Promise<number> {
  const rateResponse = await fetch(`${request.headers.get('origin')}/api/markets/rate?from=usdt&to=ngn`, {
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  });
  
  if (!rateResponse.ok) {
    throw new Error('Failed to fetch USDT/NGN rate');
  }
  
  const { rate } = await rateResponse.json();
  return rate;
}

function getFeePercentage(volumeInUSD: number): number {
  if (volumeInUSD >= 100_000) return 0.025; // 2.5% for 100K+ USD
  if (volumeInUSD >= 20_000) return 0.028; // 2.8% for 20K-100K USD
  if (volumeInUSD >= 5_000) return 0.03; // 3.0% for 5K-20K USD
  if (volumeInUSD >= 1_000) return 0.035; // 3.5% for 1K-5K USD
  return 0.04; // 4.0% for 0-1K USD
} 