import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { QuidaxServerService } from '@/lib/quidax';
import type { Database } from '@/lib/database.types';

interface MarketData {
  currency: string;
  price: number;
  change_24h: number;
}

interface Transaction {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  received_amount: string;
  execution_price: string;
  status: string;
  created_at: string;
}

interface UserProfile {
  quidax_id: string;
}

interface WalletWithValue extends Record<string, any> {
  estimated_value: number;
  market_price: number;
}

export async function GET(request: Request) {
  try {
    // Fix cookie handling by using await
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('quidax_id')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const profile = profileData as UserProfile;
    if (!profile.quidax_id) {
      return NextResponse.json({ error: 'User has no Quidax ID' }, { status: 400 });
    }

    // Initialize Quidax service
    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;
    if (!quidaxSecretKey) {
      throw new Error('QUIDAX_SECRET_KEY is not configured');
    }
    
    const quidax = new QuidaxServerService(quidaxSecretKey);

    try {
      // Fetch data in parallel
      const [walletsResponse, marketDataResponse] = await Promise.all([
        quidax.request(`/users/${profile.quidax_id}/wallets`),
        quidax.getMarketTickers()
      ]);

      // Get recent swap transactions
      const transactionsResponse = await quidax.request(`/users/${profile.quidax_id}/swap_transactions`);

      // First, get the USDT/NGN rate
      const usdtNgnMarket = marketDataResponse?.data['usdt_ngn'];
      const usdtNgnRate = usdtNgnMarket?.ticker ? parseFloat(usdtNgnMarket.ticker.last) || 0 : 0;

      console.log('USDT/NGN Rate:', usdtNgnRate);

      // Transform market data into expected format with null checks
      const transformedMarketData = Object.entries(marketDataResponse?.data || {})
        .map(([market, data]: [string, any]) => {
          if (!market || !data?.ticker) return null;
          
          // Handle market pairs safely
          const [baseCurrency, quoteCurrency] = market.toLowerCase().split('_');
          if (!baseCurrency || !quoteCurrency) return null;

          const lastPrice = parseFloat(data.ticker.last) || 0;
          const openPrice = parseFloat(data.ticker.open) || lastPrice;

          // Calculate price in NGN with proper null checks
          let priceInNGN = 0;
          if (quoteCurrency === 'ngn') {
            priceInNGN = lastPrice;
          } else if (quoteCurrency === 'usdt' && usdtNgnRate > 0) {
            priceInNGN = lastPrice * usdtNgnRate;
          }

          // Only include pairs we can price in NGN
          if (priceInNGN <= 0) return null;

          console.log(`Market: ${baseCurrency}/${quoteCurrency}, Price: ${lastPrice}, NGN Price: ${priceInNGN}`);
          
          return {
            currency: baseCurrency.toUpperCase(),
            price: priceInNGN,
            change_24h: ((lastPrice - openPrice) / openPrice) * 100,
            raw_price: lastPrice,
            quote_currency: quoteCurrency.toUpperCase()
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Add USDT/NGN market data if available
      if (usdtNgnRate > 0 && !transformedMarketData.some(m => m.currency === 'USDT')) {
        transformedMarketData.push({
          currency: 'USDT',
          price: usdtNgnRate,
          change_24h: usdtNgnMarket?.ticker ? 
            ((parseFloat(usdtNgnMarket.ticker.last) - parseFloat(usdtNgnMarket.ticker.open)) / parseFloat(usdtNgnMarket.ticker.open)) * 100 : 
            0,
          raw_price: usdtNgnRate,
          quote_currency: 'NGN'
        });
      }

      // Calculate wallet values with proper types
      const walletsWithValues = (walletsResponse?.data || []).map((wallet: any): WalletWithValue => {
        const balance = parseFloat(wallet.balance || '0');
        const currency = wallet.currency?.toUpperCase();
        let valueInNGN = 0;

        if (currency === 'NGN') {
          valueInNGN = balance;
        } else {
          // First try direct NGN pair
          let marketInfo = transformedMarketData.find(m => 
            m.currency === currency && m.quote_currency === 'NGN'
          );
          
          // If no direct NGN pair, try USDT pair
          if (!marketInfo) {
            marketInfo = transformedMarketData.find(m => 
              m.currency === currency && m.quote_currency === 'USDT'
            );
            if (marketInfo && usdtNgnRate > 0) {
              valueInNGN = balance * marketInfo.raw_price * usdtNgnRate;
            }
          } else {
            valueInNGN = balance * marketInfo.price;
          }
        }

        console.log(`Processing wallet: ${currency}, Balance: ${balance}, Value in NGN: ${valueInNGN}`);

        return {
          ...wallet,
          estimated_value: valueInNGN,
          market_price: valueInNGN / (balance || 1) // Avoid division by zero
        };
      });

      // Filter out zero balance wallets and calculate total value
      const nonZeroWallets = walletsWithValues.filter((wallet: WalletWithValue) => wallet.estimated_value > 0);
      const totalValue = nonZeroWallets.reduce((sum: number, wallet: WalletWithValue) => sum + wallet.estimated_value, 0);
      
      console.log('Total portfolio value in NGN:', totalValue);

      return NextResponse.json({
        wallets: walletsWithValues,
        marketData: transformedMarketData,
        transactions: transactionsResponse?.data || [],
        userId: profile.quidax_id
      });

    } catch (quidaxError: any) {
      console.error('Quidax API error:', quidaxError);
      return NextResponse.json(
        { error: quidaxError.message || 'Failed to fetch wallet data from Quidax' },
        { status: quidaxError.status || 500 }
      );
    }

  } catch (error) {
    console.error('Error in wallet endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 