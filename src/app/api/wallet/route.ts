import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getWallets, getMarketTickers, getSwapTransactions } from '@/lib/quidax'
import { NextResponse } from 'next/server'

interface MarketData {
  currency: string;
  price: number;
  change_24h: number;
}

export async function GET(request: Request) {
  try {
    // Create a new cookie store and supabase client
    const supabase = createRouteHandlerClient({ 
      cookies
    }, {
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    console.log('Checking authentication...');
    let user;

    // Check Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (tokenError) {
        console.error('Token auth error:', tokenError);
      } else {
        user = tokenUser;
      }
    }

    // If no valid token, try cookie-based session
    if (!user) {
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError) {
        console.error('Session auth error:', sessionError);
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      user = sessionUser;
    }

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // First check if user exists in users table
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      // Create user record if it doesn't exist
      const { error: createUserError } = await supabase
        .from('users')
        .insert([{ 
          id: user.id, 
          email: user.email,
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          kyc_level: 0,
          kyc_status: 'pending',
          kyc_verified: false
        }]);

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        return NextResponse.json({ message: 'Failed to create user record' }, { status: 500 });
      }
    }

    // Get or create user profile
    let userProfile;
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      // Create user profile if it doesn't exist
      const { data: newProfile, error: createProfileError } = await supabase
        .from('user_profiles')
        .insert([{ 
          user_id: user.id,
          full_name: [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') || null,
          email: user.email,
          kyc_status: 'pending',
          kyc_level: 0,
          kyc_verified: false,
          is_test: false,
          daily_limit: 0,
          monthly_limit: 0,
          role: 'user',
          security_level: 'BASIC',
          two_factor_enabled: false,
          completed_trades: 0,
          completion_rate: 0,
          is_verified: false,
          quidax_id: 'TEST_' + user.id.substring(0, 8)
        }])
        .select()
        .single();

      if (createProfileError) {
        console.error('Error creating user profile:', createProfileError);
        return NextResponse.json({ message: 'Failed to create user profile' }, { status: 500 });
      }

      userProfile = newProfile;
    } else {
      userProfile = existingProfile;
    }

    console.log('User profile loaded:', userProfile);

    if (!userProfile?.quidax_id) {
      console.log('No Quidax ID found');
      return NextResponse.json({ message: 'Quidax ID not found' }, { status: 400 });
    }

    // Fetch data from Quidax using the Quidax ID
    console.log('Fetching Quidax data for user:', userProfile.quidax_id);
    
    const [walletsData, marketData, transactionsData] = await Promise.all([
      getWallets(userProfile.quidax_id).catch(error => {
        console.error('Error fetching wallets:', error);
        return [];
      }),
      getMarketTickers().catch(error => {
        console.error('Error fetching market data:', error);
        return {};
      }),
      getSwapTransactions(userProfile.quidax_id).catch(error => {
        console.error('Error fetching transactions:', error);
        return [];
      })
    ]);

    console.log('Quidax API responses received');

    // Process market data
    const processedMarketData = Object.entries(marketData || {})
      .filter(([key]) => key.toLowerCase().endsWith('ngn'))
      .map(([key, value]: [string, any]) => {
        if (!value || !value.ticker) return null;
        const currency = key.replace(/ngn$/i, '').toUpperCase();
        return {
          currency,
          price: value.ticker.last ? parseFloat(value.ticker.last) : 0,
          change_24h: value.ticker.price_change_percent ? 
            parseFloat(value.ticker.price_change_percent) : 0
        };
      })
      .filter((item): item is MarketData => item !== null);

    // Add NGN as a market data entry with price of 1
    processedMarketData.push({
      currency: 'NGN',
      price: 1,
      change_24h: 0
    });

    return NextResponse.json({
      wallets: walletsData || [],
      marketData: processedMarketData,
      transactions: transactionsData || [],
      userId: userProfile.quidax_id
    });
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      message: error.message?.includes('unavailable') 
        ? 'Service temporarily unavailable' 
        : 'Failed to load wallet data'
    }, { status: 500 });
  }
} 