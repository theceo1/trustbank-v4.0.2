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

    // Define fee tiers in USD
    const volumeTiers: VolumeTiers = {
      TIER_1: { min: 0, max: 1000, fee: 4.0 },        // 0-1K USD: 4.0%
      TIER_2: { min: 1000, max: 5000, fee: 3.5 },     // 1K-5K USD: 3.5%
      TIER_3: { min: 5000, max: 20000, fee: 3.0 },    // 5K-20K USD: 3.0%
      TIER_4: { min: 20000, max: 100000, fee: 2.8 },  // 20K-100K USD: 2.8%
      TIER_5: { min: 100000, max: null, fee: 2.5 }    // 100K+ USD: 2.5%
    };

    // Define network fees
    const networkFees = {
      BTC: 0.0001,
      ETH: 0.005,
      USDT: 1
    };

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Default values for unauthenticated users
    let tradingVolume = 0;
    let currentTier: keyof VolumeTiers = 'TIER_1';
    let nextTier: VolumeTier | null = volumeTiers.TIER_2;

    // If user is authenticated, get their profile data
    if (session?.user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('kyc_tier, completed_trades, trading_volume')
        .eq('user_id', session.user.id)
        .single();

      if (profile) {
        tradingVolume = profile.trading_volume || 0;
        
        // Determine current tier based on trading volume
        for (const [tier, config] of Object.entries(volumeTiers)) {
          if (tradingVolume >= config.min && (!config.max || tradingVolume < config.max)) {
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
            } else {
              nextTier = null;
            }
            break;
          }
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      data: {
        base_fees: {
          platform: volumeTiers[currentTier].fee,
          total: volumeTiers[currentTier].fee
        },
        network_fees: networkFees,
        user_tier: {
          trading_volume: tradingVolume,
          fee_percentage: volumeTiers[currentTier].fee,
          tier_level: currentTier,
          next_tier: nextTier,
          volume_currency: 'USD'
        },
        referral_discount: 0.1,
        volume_tiers: volumeTiers,
        currency: 'USD'
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