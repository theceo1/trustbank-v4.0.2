//src/app/api/config/fees/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { QuidaxService } from 'src/lib/quidax';
import { SUPPORTED_CURRENCIES } from 'src/config/supportedCurrencies';

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

    // Fetch network fees for all supported currencies from Quidax API
    // Use centralized supported currencies config
    const networkFees: Record<string, any> = {};
    for (const { code: currency } of SUPPORTED_CURRENCIES) {
      try {
        const res = await fetch(`https://www.quidax.com/api/v1/fee?currency=${currency}`);
        const data = await res.json();
        if (data?.data?.fee) {
          networkFees[currency] = data.data.fee; // Expose all fee ranges
        } else {
          networkFees[currency] = [];
        }
      } catch (e) {
        networkFees[currency] = [];
      }
    }

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency } = body;
    if (!amount || !currency) {
      return NextResponse.json({ error: 'Missing amount or currency' }, { status: 400 });
    }
    // Use markup percent from environment variable for easy control (default 0.15 = 15%)
    const markupPercent = parseFloat(process.env.TRUSTBANK_MARKUP_PERCENT || '0.15'); // trustBank markup for profitability
    let baseFee = 0;
    let trustBankFee = 0;
    let feeCurrency = currency.toUpperCase();
    let feeRanges = [];
    let display = '';

    if (currency.toLowerCase() === 'ngn') {
      // For NGN, min fee ₦200 or 0.5% of amount
      baseFee = Math.max(200, 0.005 * Number(amount));
      trustBankFee = Math.ceil(baseFee + baseFee * markupPercent);
      display = `₦${trustBankFee}`;
      feeRanges = [{min: 0, max: null, type: 'flat', value: baseFee}];
    } else {
      // For crypto, fetch fee ranges from Quidax
      try {
        const res = await fetch(`https://www.quidax.com/api/v1/fee?currency=${currency.toUpperCase()}`);
        const data = await res.json();
        feeRanges = data?.data?.fee || [];
        // Find the highest allowed fee for this withdrawal amount
        let bestRange = null;
        for (const r of feeRanges) {
          if (Number(amount) >= r.min && Number(amount) < r.max) {
            if (!bestRange || r.value > bestRange.value) bestRange = r;
          }
        }
        if (!bestRange && feeRanges.length > 0) bestRange = feeRanges[feeRanges.length-1];
        baseFee = bestRange ? bestRange.value : 0;
        trustBankFee = baseFee > 0 ? +(baseFee + baseFee * markupPercent).toFixed(8) : 0;
        display = `${trustBankFee} ${currency.toUpperCase()}`;
      } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch fee structure from Quidax' }, { status: 500 });
      }
    }

    return NextResponse.json({
      base_fee: baseFee,
      trustbank_fee: trustBankFee,
      currency: feeCurrency,
      display,
      markup_percent: markupPercent,
      fee_ranges: feeRanges
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}