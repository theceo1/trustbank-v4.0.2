//src/app/api/wallet/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createQuidaxServer, QuidaxWallet } from '@/lib/quidax';
import type { Database } from '@/lib/database.types';
import type { MarketData } from '@/types/wallet';

interface QuidaxTransaction {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  received_amount: string;
  execution_price: string;
  status: string;
  created_at: string;
}

interface QuidaxMarketData {
  [market: string]: {
    ticker: {
      last: string;
      open: string;
      high: string;
      low: string;
      volume: string;
    };
  };
}

interface QuidaxResponse<T> {
  status: string;
  message?: string;
  data: T;
}

interface UserProfile {
  quidax_id: string;
}

interface WalletWithValue extends QuidaxWallet {
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
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', {
        error: profileError,
        data: profileData,
        userId: session.user.id
      });
      return NextResponse.json({ 
        error: 'Failed to fetch user profile',
        details: profileError
      }, { status: 500 });
    }

    const profile = profileData as UserProfile;
    if (!profile?.quidax_id) {
      return NextResponse.json({
        wallets: [],
        marketData: [],
        transactions: [],
        totalValueNGN: 0,
        totalValueUSD: 0,
        status: 'pending',
        message: 'Your account is being set up. Please check back in a few minutes.'
      });
    }

    // Initialize Quidax service
    const quidaxSecretKey = process.env.QUIDAX_SECRET_KEY;
    if (!quidaxSecretKey) {
      console.error('QUIDAX_SECRET_KEY not configured');
      return NextResponse.json({ 
        error: 'Service configuration error',
        details: 'Missing API key'
      }, { status: 500 });
    }
    
    const quidax = createQuidaxServer(quidaxSecretKey);

    try {
      // Fetch wallets first
      const walletsResponse = await quidax.getWallets(profile.quidax_id)
        .catch(error => {
          console.error('Error fetching wallets:', {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data,
            userId: profile.quidax_id
          });
          
          // Check for specific error conditions
          if (error.response?.status === 401) {
            console.error('Authentication failed - check QUIDAX_SECRET_KEY');
          } else if (error.response?.status === 403) {
            console.error('Authorization failed - check user permissions');
          } else if (error.response?.status === 429) {
            console.error('Rate limit exceeded');
          }
          
          return [] as QuidaxWallet[];
        });

      // Retry market data fetch up to 3 times
      let marketDataResponse;
      let retryCount = 0;
      const maxRetries = 3;
      const FALLBACK_USDT_NGN_RATE = 1500; // Fallback rate if market data is unavailable

      // Add fallback prices in USDT
      const FALLBACK_PRICES: Record<string, number> = {
        BTC: 65000,  // BTC/USDT
        ETH: 3500,   // ETH/USDT
        SOL: 125,    // SOL/USDT
        BNB: 500,    // BNB/USDT
        XRP: 0.6,    // XRP/USDT
        ADA: 0.6,    // ADA/USDT
        DOGE: 0.15,  // DOGE/USDT
        DOT: 7,      // DOT/USDT
        LINK: 15,    // LINK/USDT
        MATIC: 0.8,  // MATIC/USDT
      };

      while (retryCount < maxRetries) {
        try {
          marketDataResponse = await quidax.getMarketTickers();
          
          if (marketDataResponse?.data && Object.keys(marketDataResponse.data).length > 0) {
            break;
          } else {
            throw new Error('Empty market data response');
          }
        } catch (error) {
          retryCount++;
          
          if (retryCount === maxRetries) {
            console.warn('All market data fetch attempts failed, using empty data');
            marketDataResponse = { data: {} };
          } else {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }
      }

      // Get recent swap transactions
      const transactionsResponse = await quidax.getSwapTransactions(profile.quidax_id)
        .catch(error => {
          console.error('Error fetching transactions:', error);
          return [];
        });

      // Transform market data
      const transformedMarketData: MarketData[] = [];
      
      if (marketDataResponse?.data && typeof marketDataResponse.data === 'object') {
        // Process each market pair from the response
        for (const [market, data] of Object.entries<any>(marketDataResponse.data)) {
          // Skip if data is not in expected format
          if (!data?.ticker) {
            continue;
          }

          // Market pairs are in format basecurrency_quotecurrency (e.g., btcngn)
          // Handle both 3 and 4 character quote currencies (e.g., NGN, USDT)
          let baseCurrency, quoteCurrency;
          
          if (market.endsWith('usdt')) {
            baseCurrency = market.slice(0, -4);
            quoteCurrency = 'USDT';
          } else if (market.endsWith('ngn')) {
            baseCurrency = market.slice(0, -3);
            quoteCurrency = 'NGN';
          } else if (market.endsWith('btc')) {
            baseCurrency = market.slice(0, -3);
            quoteCurrency = 'BTC';
          } else {
            continue;
          }
          
          if (!baseCurrency || !quoteCurrency) {
            continue;
          }

          const ticker = data.ticker;
          const lastPrice = parseFloat(ticker.last) || 0;
          const openPrice = parseFloat(ticker.open) || lastPrice;
          const change24h = openPrice ? ((lastPrice - openPrice) / openPrice) * 100 : 0;

          transformedMarketData.push({
            currency: baseCurrency.toUpperCase(),
            quote_currency: quoteCurrency.toUpperCase(),
            price: lastPrice,
            raw_price: lastPrice,
            change_24h: change24h
          });
        }
      } else {
        console.error('Invalid market data response:', marketDataResponse);
      }

      // Get USDT/NGN rate from transformed data or use fallback
      const usdtNgnMarket = transformedMarketData.find(m => 
        m.currency === 'USDT' && m.quote_currency === 'NGN'
      );
      const usdtNgnRate = usdtNgnMarket?.price || FALLBACK_USDT_NGN_RATE;

      // Calculate wallet values
      const walletsWithValues = (walletsResponse || []).map((wallet: QuidaxWallet) => {
        const balance = parseFloat(wallet.balance || '0');
        const currency = wallet.currency?.toUpperCase();
        let valueInNGN = 0;
        let marketPrice = 0;

        if (currency === 'NGN') {
          valueInNGN = balance;
          marketPrice = 1;
        } else if (currency === 'USDT') {
          valueInNGN = balance * usdtNgnRate;
          marketPrice = usdtNgnRate;
        } else {
          // Try to get price from market data first
          const ngnPair = transformedMarketData.find(m => 
            m.currency === currency && m.quote_currency === 'NGN'
          );
          
          if (ngnPair?.price) {
            valueInNGN = balance * ngnPair.price;
            marketPrice = ngnPair.price;
          } else {
            // Try USDT pair from market data
            const usdtPair = transformedMarketData.find(m => 
              m.currency === currency && m.quote_currency === 'USDT'
            );
            
            if (usdtPair?.price && usdtNgnRate > 0) {
              valueInNGN = balance * usdtPair.price * usdtNgnRate;
              marketPrice = usdtPair.price * usdtNgnRate;
            } else {
              // Use fallback prices if available
              const fallbackUsdtPrice = FALLBACK_PRICES[currency];
              if (fallbackUsdtPrice) {
                valueInNGN = balance * fallbackUsdtPrice * usdtNgnRate;
                marketPrice = fallbackUsdtPrice * usdtNgnRate;
              }
            }
          }
        }

        return {
          ...wallet,
          balance: balance.toString(),
          estimated_value: valueInNGN,
          market_price: marketPrice
        };
      });

      // Calculate total portfolio value
      const totalValueNGN = walletsWithValues.reduce((sum, wallet) => {
        const value = wallet.estimated_value || 0;
        return sum + value;
      }, 0);

      // Calculate total USD value
      const totalValueUSD = usdtNgnRate > 0 ? totalValueNGN / usdtNgnRate : 0;

      return NextResponse.json({
        wallets: walletsWithValues,
        marketData: transformedMarketData,
        transactions: transactionsResponse || [],
        totalValueNGN,
        totalValueUSD,
        userId: session.user.id
      });

    } catch (quidaxError: any) {
      console.error('[Wallet] API error:', quidaxError);
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Failed to fetch wallet data. Please try again later.',
          code: 'FETCH_ERROR'
        },
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