import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type VolumeTier = {
  min: number;
  max: number | null;
  fee: number;
};

type VolumeTiers = {
  [key in 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4' | 'TIER_5']: VolumeTier;
};

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { status: 'error', message: 'Authentication error' },
        { status: 401 }
      );
    }
    if (!session) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to determine tier
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('kyc_tier, completed_trades')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { status: 'error', message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Define fee tiers based on number of completed trades for now
    // We'll update this to use trading_volume once the column is added
    const volumeTiers: VolumeTiers = {
      TIER_1: { min: 0, max: 1000000, fee: 4.0 },        // 0-1M NGN: 4.0%
      TIER_2: { min: 1000000, max: 5000000, fee: 3.5 },  // 1M-5M NGN: 3.5%
      TIER_3: { min: 5000000, max: 20000000, fee: 3.0 }, // 5M-20M NGN: 3.0%
      TIER_4: { min: 20000000, max: 100000000, fee: 2.8 }, // 20M-100M NGN: 2.8%
      TIER_5: { min: 100000000, max: null, fee: 2.5 }    // 100M+ NGN: 2.5%
    };

    // Get current tier based on completed trades
    const completedTrades = profile.completed_trades || 0;
    let currentTier: keyof VolumeTiers = 'TIER_1';
    let nextTier: VolumeTier | null = null;

    for (const [tier, config] of Object.entries(volumeTiers)) {
      if (completedTrades >= config.min && (!config.max || completedTrades < config.max)) {
        currentTier = tier as keyof VolumeTiers;
        // Find next tier
        const tiers = Object.entries(volumeTiers);
        const currentIndex = tiers.findIndex(([t]) => t === tier);
        if (currentIndex < tiers.length - 1) {
          const [nextTierKey, nextTierConfig] = tiers[currentIndex + 1];
          nextTier = {
            min: nextTierConfig.min,
            max: nextTierConfig.max,
            fee: nextTierConfig.fee
          };
        }
        break;
      }
    }

    // Define network fees
    const networkFees = {
      BTC: 0.0001,
      ETH: 0.005,
      USDT: 1
    };

    return NextResponse.json({
      status: 'success',
      data: {
        base_fees: {
          platform: 3.0,  // Combined platform fee
          total: 3.0
        },
        network_fees: networkFees,
        user_tier: {
          completed_trades: completedTrades,
          fee_percentage: volumeTiers[currentTier].fee,
          tier_level: currentTier,
          next_tier: nextTier
        },
        referral_discount: 0.1,
        volume_tiers: volumeTiers
      }
    });

  } catch (error) {
    console.error('Error in fees endpoint:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to fetch fee configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 