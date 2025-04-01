import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { QuidaxServerService } from '@/lib/quidax';

// Define supported networks for each currency
const CURRENCY_NETWORKS: Record<string, string[]> = {
  btc: ['btc', 'bitcoin'],
  eth: ['erc20', 'ethereum'],
  usdt: ['erc20', 'trc20', 'bep20'],
  usdc: ['erc20', 'trc20', 'bep20'],
  bnb: ['bep20'],
  trx: ['trc20'],
  xrp: ['ripple'],
  sol: ['sol'],
  matic: ['polygon'],
  ada: ['ada'],
  dot: ['dot'],
  doge: ['dogecoin'],
  shib: ['erc20'],
  link: ['erc20'],
  bch: ['bch'],
  ltc: ['ltc'],
  aave: ['erc20'],
  algo: ['algo'],
  near: ['near'],
  fil: ['fil'],
  sand: ['erc20'],
  mana: ['erc20'],
  ape: ['erc20'],
  sui: ['sui'],
  inj: ['inj'],
  arb: ['arb'],
  ton: ['ton'],
  rndr: ['erc20'],
  stx: ['stx'],
  grt: ['erc20'],
  trump: ['erc20'],
  pol: ['polygon'],
  qdx: ['erc20']
};

// List of fiat currencies
const FIAT_CURRENCIES = ['ngn', 'usd', 'eur', 'gbp'];

// Currency display names
const CURRENCY_NAMES: Record<string, string> = {
  ngn: 'Naira',
  usd: 'US Dollar',
  trump: 'Official Trump',
  // Add other currency names as needed
};

function getDefaultNetwork(currency: string): string {
  const networks = CURRENCY_NETWORKS[currency.toLowerCase()];
  if (!networks || networks.length === 0) {
    throw new Error(`No networks available for currency: ${currency}`);
  }
  return networks[0];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency')?.toLowerCase();
    const network = searchParams.get('network')?.toLowerCase();

    console.log('[WalletAddress] Request params:', { currency, network });

    if (!currency) {
      console.log('[WalletAddress] Missing currency parameter');
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Currency is required',
          error: 'Currency parameter is missing'
        },
        { status: 400 }
      );
    }

    // Check if currency is supported
    if (!CURRENCY_NETWORKS[currency]) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Currency ${currency} is not supported`,
          error: 'Unsupported currency'
        },
        { status: 400 }
      );
    }

    // If network is not provided, use default network
    const targetNetwork = network || getDefaultNetwork(currency);

    // Validate network
    if (!CURRENCY_NETWORKS[currency].includes(targetNetwork)) {
      return NextResponse.json(
        {
          status: 'error',
          message: `Network ${targetNetwork} is not supported for ${currency}`,
          error: 'Unsupported network',
          details: {
            currency,
            network: targetNetwork,
            supported_networks: CURRENCY_NETWORKS[currency]
          }
        },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('[WalletAddress] No session found');
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Unauthorized',
          error: 'No session found'
        },
        { status: 401 }
      );
    }

    console.log('[WalletAddress] Session user:', session.user.id);

    // Get user's Quidax ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('quidax_id, user_id')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      console.error('[WalletAddress] Profile fetch error:', profileError);
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Failed to fetch user profile',
          error: profileError.message
        },
        { status: 500 }
      );
    }

    if (!profile?.quidax_id) {
      console.log('[WalletAddress] No wallet ID found for user:', session.user.id);
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Your account is still being set up',
          error: 'Please wait a few minutes for your account setup to complete',
          code: 'ACCOUNT_SETUP_PENDING'
        },
        { status: 202 }
      );
    }

    console.log('[WalletAddress] Found wallet ID:', profile.quidax_id);

    // For fiat currencies, return early with bank transfer message
    if (FIAT_CURRENCIES.includes(currency)) {
      return NextResponse.json({
        status: 'success',
        message: 'Bank transfer details',
        data: {
          currency: currency,
          is_crypto: false,
          transfer_type: 'bank',
          message: 'Please use bank transfer for fiat deposits'
        }
      });
    }

    // Initialize service
    if (!process.env.QUIDAX_SECRET_KEY) {
      console.error('[WalletAddress] Missing API configuration');
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Service temporarily unavailable',
          error: 'Internal configuration error'
        },
        { status: 500 }
      );
    }

    const quidaxService = new QuidaxServerService(process.env.QUIDAX_SECRET_KEY);

    try {
      console.log('[WalletAddress] Fetching address for:', { 
        currency, 
        network: targetNetwork,
        userId: profile.quidax_id,
        apiUrl: process.env.NEXT_PUBLIC_QUIDAX_API_URL,
        hasSecretKey: !!process.env.QUIDAX_SECRET_KEY
      });
      
      // First try to get existing address
      const existingAddressResponse = await quidaxService.request(
        `/users/${profile.quidax_id}/wallets/${currency}/address`
      ).catch(error => {
        console.error('[WalletAddress] Error fetching existing address:', {
          error: error.response?.data || error.message,
          status: error.response?.status
        });
        return null;
      });

      console.log('[WalletAddress] Raw existing address response:', JSON.stringify(existingAddressResponse, null, 2));

      let depositAddress = null;
      let destinationTag = null;

      if (existingAddressResponse?.data?.address) {
        depositAddress = existingAddressResponse.data.address;
        destinationTag = existingAddressResponse.data.tag;
        console.log('[WalletAddress] Found existing address:', { depositAddress, destinationTag });
      } else {
        console.log('[WalletAddress] No existing address, creating new one with params:', {
          userId: profile.quidax_id,
          currency,
          network: targetNetwork
        });
        
        // Create new address with network as query parameter
        const newAddressResponse = await quidaxService.request(
          `/users/${profile.quidax_id}/wallets/${currency}/addresses?network=${targetNetwork}`,
          {
            method: 'POST'
          }
        ).catch(error => {
          console.error('[WalletAddress] Error creating new address:', {
            error: error.response?.data || error.message,
            status: error.response?.status
          });
          throw error;
        });

        console.log('[WalletAddress] Raw new address response:', JSON.stringify(newAddressResponse, null, 2));

        if (newAddressResponse?.data?.address) {
          depositAddress = newAddressResponse.data.address;
          destinationTag = newAddressResponse.data.tag;
          console.log('[WalletAddress] Created new address:', { depositAddress, destinationTag });
        } else {
          console.error('[WalletAddress] No address in new address response:', newAddressResponse);
        }
      }

      if (!depositAddress) {
        console.error('[WalletAddress] Failed to get or create address');
        return NextResponse.json(
          { 
            status: 'error',
            message: 'Unable to generate deposit address',
            error: 'Failed to create deposit address. Please try again later.'
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: 'success',
        message: 'Address generated successfully',
        data: {
          currency,
          network: targetNetwork,
          deposit_address: depositAddress,
          destination_tag: destinationTag,
          is_crypto: true
        }
      });

    } catch (error: any) {
      console.error('[WalletAddress] API error:', error);
      
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Unable to process request',
          error: 'Failed to generate deposit address. Please try again later.'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[WalletAddress] Unhandled error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to process request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
 