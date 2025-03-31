import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { QuidaxServerService } from '@/lib/quidax';

// Define supported networks for each currency
const CURRENCY_NETWORKS: Record<string, string[]> = {
  btc: ['bitcoin'],
  eth: ['ethereum', 'erc20'],
  usdt: ['ethereum', 'erc20', 'trc20', 'bep20'],
  usdc: ['ethereum', 'erc20', 'trc20', 'bep20'],
  trx: ['tron', 'trc20'],
  bnb: ['bsc', 'bep20'],
  xrp: ['ripple'],
  sol: ['solana'],
  matic: ['polygon'],
  ada: ['cardano'],
  dot: ['polkadot'],
  doge: ['dogecoin'],
  shib: ['ethereum', 'erc20'],
  link: ['ethereum', 'erc20'],
  bch: ['bitcoin-cash'],
  ltc: ['litecoin'],
  aave: ['ethereum', 'erc20'],
  algo: ['algorand'],
  near: ['near'],
  fil: ['filecoin'],
  sand: ['ethereum', 'erc20'],
  mana: ['ethereum', 'erc20'],
  ape: ['ethereum', 'erc20'],
  sui: ['sui'],
  inj: ['injective'],
  arb: ['arbitrum'],
  ton: ['ton'],
  rndr: ['ethereum', 'erc20'],
  stx: ['stacks'],
  grt: ['ethereum', 'erc20'],
  trump: ['ethereum', 'erc20']
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
  if (!networks) return '';
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

    // Validate network parameter
    if (!network) {
      console.log('[WalletAddress] Missing network parameter');
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Network is required',
          error: 'Network parameter is missing'
        },
        { status: 400 }
      );
    }

    // Check if network is supported for the currency
    const supportedNetworks = CURRENCY_NETWORKS[currency];
    if (!supportedNetworks?.includes(network)) {
      console.log('[WalletAddress] Unsupported network:', { currency, network, supportedNetworks });
      return NextResponse.json(
        { 
          status: 'error',
          message: `Network ${network} is not supported for ${currency}`,
          error: 'Unsupported network',
          details: {
            currency,
            network,
            supported_networks: supportedNetworks || []
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
          message: 'Account setup incomplete',
          error: 'Please complete your account setup'
        },
        { status: 404 }
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
      console.log('[WalletAddress] Fetching address for:', { currency, network, userId: profile.quidax_id });
      
      // First try to get existing address
      const existingAddressResponse = await quidaxService.request(
        `/users/${profile.quidax_id}/wallets/${currency}/address`
      );

      console.log('[WalletAddress] Existing address response:', existingAddressResponse);

      let depositAddress = null;
      let destinationTag = null;

      if (existingAddressResponse?.data?.address) {
        depositAddress = existingAddressResponse.data.address;
        destinationTag = existingAddressResponse.data.tag;
        console.log('[WalletAddress] Found existing address:', depositAddress);
      } else {
        console.log('[WalletAddress] No existing address, creating new one');
        // Create new address with network as query parameter
        const newAddressResponse = await quidaxService.request(
          `/users/${profile.quidax_id}/wallets/${currency}/addresses?network=${network}`,
          {
            method: 'POST'
          }
        );

        console.log('[WalletAddress] New address response:', newAddressResponse);

        if (newAddressResponse?.data?.address) {
          depositAddress = newAddressResponse.data.address;
          destinationTag = newAddressResponse.data.tag;
          console.log('[WalletAddress] Created new address:', depositAddress);
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
          network,
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
 