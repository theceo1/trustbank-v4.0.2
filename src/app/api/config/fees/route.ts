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

// List of currencies supported by Quidax /fee endpoint
const SUPPORTED_FEE_CURRENCIES = [
  'USDC', 'BUSD', 'BTC', 'LTC', 'ETH', 'XRP', 'USDT', 'DASH', 'TRX', 'DOGE', 'BNB', 'MATIC', 'SHIB', 'AXS', 'SAFE', 'CAKE', 'XLM', 'AAVE', 'LINK'
  // Add/remove as Quidax updates their API
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency } = body;
    if (!amount || !currency) {
      return NextResponse.json({ error: 'Missing amount or currency' }, { status: 400 });
    }
    // --- trustBank NGN Deposit Fee Logic (2025+) ---
    // Only this logic is valid for NGN fees. All legacy/base fee logic is removed.
    if (currency.toLowerCase() === 'ngn') {
      /**
       * trustBank NGN Deposit Fee Logic (PREVIEW ONLY):
       * - Service Fee: trustBank Markup (env, fallback 4%) + processing fee (1.5%)
       * - VAT: Optionally passed in request body for preview, otherwise 0 (final VAT comes from payment processor API)
       * - Total Fee: service_fee + vat
       * - you_receive = amount - total_fee
       * - This is for preview only; final values come from payment processor API.
       */
      const korapayPercent = 0.015; // 1.5%
      // Markup is capped at TRUSTBANK_MARKUP_PERCENT (max) and floored at TRUSTBANK_MARKUP_MIN_PERCENT (min)
      const markupPercent = parseFloat(process.env.TRUSTBANK_MARKUP_PERCENT || '0.025'); // 2.5% max
      const markupMinPercent = parseFloat(process.env.TRUSTBANK_MARKUP_MIN_PERCENT || '0.015'); // 1.5% min
      let markup = Number(amount) * markupPercent;
      const markupMin = Number(amount) * markupMinPercent;
      if (markup < markupMin) markup = markupMin;
      // Korapay fee and VAT provided by frontend (from Korapay API) for preview, else default to 0
      let korapay_fee = 0;
      if ('korapay_fee' in body && typeof body.korapay_fee === 'number') {
        korapay_fee = Number(body.korapay_fee);
      }
      let vat = 0;
      if ('vat' in body && typeof body.vat === 'number') {
        vat = Number(body.vat);
      }
      // Service fee is just the markup
      const serviceFee = markup;
      const totalFee = serviceFee + korapay_fee + vat;
      const youReceive = Number(amount) - totalFee;
      // Respond with all values for frontend (preview only)
      return NextResponse.json({
        status: 'success',
        data: {
          amount: Number(amount),
          service_fee: +serviceFee.toFixed(2),
          markup: +markup.toFixed(2),
          korapay_fee: +korapay_fee.toFixed(2),
          vat: +vat.toFixed(2),
          total_fee: +totalFee.toFixed(2),
          you_receive: +youReceive.toFixed(2),
          markup_percent: markupPercent,
          currency: 'NGN',
        }
      });
    } else if (SUPPORTED_FEE_CURRENCIES.includes(currency.toUpperCase())) {
      // For supported crypto, fetch fee ranges from Quidax
      try {
        const fetchUrl = `https://www.quidax.com/api/v1/fee?currency=${currency.toUpperCase()}`;
        console.log('[FEE DEBUG] Fetching Quidax:', fetchUrl);
        const res = await fetch(fetchUrl);
        console.log('[FEE DEBUG] Quidax response status:', res.status);
        let data: any = {};
        let isJson = false;
        try {
          data = await res.json();
          isJson = true;
        } catch (parseErr) {
          // Not JSON, likely HTML or text error
          console.error('[FEE DEBUG] Failed to parse Quidax response as JSON', parseErr);
        }
        if (!isJson || res.status !== 200 || !data || data.status !== 'success' || !data.data || !Array.isArray(data.data.fee)) {
          // Return a structured error to frontend
          return NextResponse.json({
            error: 'Quidax fee API error',
            details: data && data.message ? data.message : `Invalid response for currency: ${currency}`
          }, { status: 502 });
        }
        const feeRanges = data.data.fee;
        console.log('[FEE DEBUG] feeRanges:', feeRanges);
        // Find the highest allowed fee for this withdrawal amount
        let bestRange = null;
        for (const r of feeRanges) {
          if (Number(amount) >= r.min && Number(amount) < r.max) {
            if (!bestRange || r.value > bestRange.value) bestRange = r;
          }
        }
        if (!bestRange && feeRanges.length > 0) bestRange = feeRanges[feeRanges.length-1];
        const baseFee = bestRange ? bestRange.value : 0;
        // Markup for crypto withdrawals (if applicable)
        const markupPercent = parseFloat(process.env.TRUSTBANK_MARKUP_PERCENT || '0.04');
        const trustBankFee = baseFee > 0 ? +(baseFee + baseFee * markupPercent).toFixed(8) : 0;
        console.log('[FEE DEBUG] bestRange:', bestRange);
        console.log('[FEE DEBUG] baseFee:', baseFee, 'trustBankFee:', trustBankFee);
      } catch (e) {
        if (e instanceof Error) {
          console.error('[FEE DEBUG] Error fetching/parsing Quidax fee:', e.stack);
          return NextResponse.json({ error: 'Failed to fetch fee structure from Quidax', details: e.message }, { status: 500 });
        } else {
          console.error('[FEE DEBUG] Error fetching/parsing Quidax fee:', String(e));
          return NextResponse.json({ error: 'Failed to fetch fee structure from Quidax', details: String(e) }, { status: 500 });
        }
      }
    } else {
      // Not a supported fee currency
      return NextResponse.json({
        error: `Network fee not supported for currency: ${currency}`,
        details: `Allowed currencies: ${SUPPORTED_FEE_CURRENCIES.join(', ')}`
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}