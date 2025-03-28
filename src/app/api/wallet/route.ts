import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { QuidaxServerService } from '@/lib/quidax';
import type { Database } from '@/lib/database.types';
import type { MarketData } from '@/types/wallet';

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
      console.log('Fetching wallet and market data...');
      const [walletsResponse, marketDataResponse] = await Promise.all([
        quidax.request(`/users/${profile.quidax_id}/wallets`),
        quidax.getMarketTickers()
      ]);

      // Log raw responses for debugging
      console.log('Wallets Response:', {
        status: walletsResponse?.status,
        walletCount: walletsResponse?.data?.length || 0
      });

      console.log('Market Data Response:', {
        status: marketDataResponse?.status,
        markets: marketDataResponse?.data ? Object.keys(marketDataResponse.data) : []
      });

      // Get recent swap transactions
      const transactionsResponse = await quidax.request(`/users/${profile.quidax_id}/swap_transactions`);

      // Transform market data
      const transformedMarketData: MarketData[] = [];
      
      if (marketDataResponse?.data && typeof marketDataResponse.data === 'object') {
        console.log('Raw market data:', marketDataResponse.data);
        
        // Process each market pair from the response
        for (const [market, data] of Object.entries<any>(marketDataResponse.data)) {
          // Skip if data is not in expected format
          if (!data?.ticker) {
            console.log(`Skipping market ${market} - no ticker data`);
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
            console.log(`Skipping market ${market} - unknown quote currency`);
            continue;
          }
          
          if (!baseCurrency || !quoteCurrency) {
            console.log(`Skipping market ${market} - cannot parse pair`);
            continue;
          }

          const ticker = data.ticker;
          const lastPrice = parseFloat(ticker.last) || 0;
          const openPrice = parseFloat(ticker.open) || lastPrice;
          const change24h = openPrice ? ((lastPrice - openPrice) / openPrice) * 100 : 0;

          console.log(`Processing market ${market}:`, {
            baseCurrency: baseCurrency.toUpperCase(),
            quoteCurrency: quoteCurrency.toUpperCase(),
            lastPrice,
            openPrice,
            change24h,
            rawTicker: ticker
          });

          transformedMarketData.push({
            currency: baseCurrency.toUpperCase(),
            quote_currency: quoteCurrency.toUpperCase(),
            price: lastPrice,
            raw_price: lastPrice,
            change_24h: change24h
          });
        }

        // Log all transformed market data for debugging
        console.log('Transformed market data:', transformedMarketData.map(m => ({
          pair: `${m.currency}/${m.quote_currency}`,
          price: m.price
        })));
      } else {
        console.error('Invalid market data response:', marketDataResponse);
      }

      // Get USDT/NGN rate from transformed data
      const usdtNgnMarket = transformedMarketData.find(m => 
        m.currency === 'USDT' && m.quote_currency === 'NGN'
      );
      const usdtNgnRate = usdtNgnMarket?.price || 0;
      console.log('USDT/NGN Rate:', usdtNgnRate);

      // Calculate wallet values
      const walletsWithValues = (walletsResponse?.data || []).map((wallet: any) => {
        const balance = parseFloat(wallet.balance || '0');
        const currency = wallet.currency?.toUpperCase();
        let valueInNGN = 0;

        console.log(`Processing wallet ${currency}:`, {
          balance,
          currency
        });

        if (currency === 'NGN') {
          valueInNGN = balance;
        } else if (currency === 'USDT') {
          // For USDT, use the USDT/NGN rate directly
          valueInNGN = balance * usdtNgnRate;
          console.log('USDT value calculation:', {
            balance,
            usdtNgnRate,
            valueInNGN
          });
        } else {
          // Try direct NGN pair first
          const ngnPair = transformedMarketData.find(m => 
            m.currency === currency && m.quote_currency === 'NGN'
          );
          
          if (ngnPair?.price) {
            valueInNGN = balance * ngnPair.price;
            console.log(`Using NGN pair for ${currency}:`, {
              price: ngnPair.price,
              valueInNGN
            });
          } else {
            // Try USDT pair with conversion to NGN
            const usdtPair = transformedMarketData.find(m => 
              m.currency === currency && m.quote_currency === 'USDT'
            );
            
            if (usdtPair?.price && usdtNgnRate > 0) {
              valueInNGN = balance * usdtPair.price * usdtNgnRate;
              console.log(`Using USDT pair for ${currency}:`, {
                usdtPrice: usdtPair.price,
                usdtNgnRate,
                valueInNGN
              });
            } else {
              // Try BTC pair as last resort
              const btcPair = transformedMarketData.find(m => 
                m.currency === currency && m.quote_currency === 'BTC'
              );
              const btcNgnPair = transformedMarketData.find(m => 
                m.currency === 'BTC' && m.quote_currency === 'NGN'
              );
              
              if (btcPair?.price && btcNgnPair?.price) {
                valueInNGN = balance * btcPair.price * btcNgnPair.price;
                console.log(`Using BTC pair for ${currency}:`, {
                  btcPrice: btcPair.price,
                  btcNgnPrice: btcNgnPair.price,
                  valueInNGN
                });
              }
            }
          }
        }

        // Ensure we have a valid number
        valueInNGN = Number.isFinite(valueInNGN) ? valueInNGN : 0;

        console.log(`Final value for ${currency}:`, {
          valueInNGN,
          marketPrice: valueInNGN / (balance || 1)
        });

        return {
          ...wallet,
          estimated_value: valueInNGN,
          market_price: valueInNGN / (balance || 1)
        };
      });

      // Calculate total portfolio value
      const totalValue = walletsWithValues.reduce((sum: number, wallet: WalletWithValue) => 
        sum + (wallet.estimated_value || 0), 
        0
      );
      
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