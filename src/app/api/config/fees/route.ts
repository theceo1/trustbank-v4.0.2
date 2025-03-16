import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Fee tiers based on 30-day trading volume (in USD)
const VOLUME_TIERS = {
  TIER_1: { min: 0, max: 10000, fee: 3.0 }, // 0-10k: 3.0%
  TIER_2: { min: 10000, max: 50000, fee: 2.5 }, // 10k-50k: 2.5%
  TIER_3: { min: 50000, max: 100000, fee: 2.0 }, // 50k-100k: 2.0%
  TIER_4: { min: 100000, max: 500000, fee: 1.5 }, // 100k-500k: 1.5%
  TIER_5: { min: 500000, max: Infinity, fee: 1.0 }, // 500k+: 1.0%
};

// Network fees in the respective currency
const NETWORK_FEES = {
  BTC: 0.0001,
  ETH: 0.005,
  USDT: 1,
};

// Base fee configuration
const BASE_FEES = {
  quidax: 1.4, // Quidax's fee
  trustBank: 1.6, // Our additional fee
  total: 3.0, // Total fee percentage
};

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's 30-day trading volume
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('amount, price')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (tradesError) {
      console.error('Error fetching trading volume:', tradesError);
      return NextResponse.json({ error: 'Failed to fetch trading volume' }, { status: 500 });
    }

    // Calculate total trading volume
    const tradingVolume = trades?.reduce((total, trade) => {
      return total + (parseFloat(trade.amount) * parseFloat(trade.price));
    }, 0) || 0;

    // Determine user's fee tier
    let userTier = VOLUME_TIERS.TIER_1;
    for (const tier of Object.values(VOLUME_TIERS)) {
      if (tradingVolume >= tier.min && tradingVolume < tier.max) {
        userTier = tier;
        break;
      }
    }

    // Get user's referral status
    const { data: referral } = await supabase
      .from('referrals')
      .select('referral_code, referred_users')
      .eq('user_id', user.id)
      .single();

    // Calculate referral discount (0.1% per referral, max 0.5%)
    const referralDiscount = referral
      ? Math.min((referral.referred_users?.length || 0) * 0.1, 0.5)
      : 0;

    // Final fee calculation
    const finalFee = Math.max(userTier.fee - referralDiscount, BASE_FEES.quidax + 0.1); // Never go below Quidax fee + 0.1%

    return NextResponse.json({
      status: 'success',
      data: {
        base_fees: BASE_FEES,
        network_fees: NETWORK_FEES,
        user_tier: {
          trading_volume: tradingVolume,
          fee_percentage: finalFee,
          tier_level: Object.keys(VOLUME_TIERS).find(key => 
            VOLUME_TIERS[key as keyof typeof VOLUME_TIERS] === userTier
          ),
          next_tier: tradingVolume < VOLUME_TIERS.TIER_5.min 
            ? Object.values(VOLUME_TIERS).find(tier => tier.min > tradingVolume)
            : null
        },
        referral_discount: referralDiscount,
        volume_tiers: VOLUME_TIERS
      }
    });
  } catch (error) {
    console.error('Error in fees config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 