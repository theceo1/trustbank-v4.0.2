const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const QUIDAX_API_URL = process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!QUIDAX_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SwapQuotation {
  data: {
    id: string;
    from_amount: string;
    to_amount: string;
    from_currency: string;
    to_currency: string;
    quoted_price: string;
    expires_at: string;
  }
}

interface SwapConfirmation {
  data: {
    status: string;
    from_amount: string;
    received_amount: string;
    from_currency: string;
    to_currency: string;
    execution_price: string;
  }
}

async function testSwap(
  quidaxId: string,
  fromCurrency: string,
  toCurrency: string,
  amount: string
) {
  try {
    console.log(`Creating swap quotation for ${fromCurrency} to ${toCurrency}...`);
    
    // Get user's ID from profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id')
      .eq('quidax_id', quidaxId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Step 1: Create swap quotation
    const quotationResponse = await fetch(
      `${QUIDAX_API_URL}/users/${quidaxId}/swap_quotation`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_currency: fromCurrency.toLowerCase(),
          to_currency: toCurrency.toLowerCase(),
          from_amount: amount
        })
      }
    );

    if (!quotationResponse.ok) {
      const error = await quotationResponse.text();
      throw new Error(`Failed to create swap quotation: ${error}`);
    }

    const quotationData = await quotationResponse.json() as SwapQuotation;
    console.log('\nQuotation received:');
    console.log('From:', quotationData.data.from_amount, quotationData.data.from_currency.toUpperCase());
    console.log('To:', quotationData.data.to_amount, quotationData.data.to_currency.toUpperCase());
    console.log('Rate:', quotationData.data.quoted_price);
    console.log('Expires at:', new Date(quotationData.data.expires_at).toLocaleString());

    // Step 2: Confirm the swap
    console.log('\nConfirming swap...');
    const confirmResponse = await fetch(
      `${QUIDAX_API_URL}/users/${quidaxId}/swap_quotation/${quotationData.data.id}/confirm`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!confirmResponse.ok) {
      const error = await confirmResponse.text();
      throw new Error(`Failed to confirm swap: ${error}`);
    }

    const confirmData = await confirmResponse.json() as SwapConfirmation;
    console.log('\nSwap confirmed!');
    console.log('Status:', confirmData.data.status);
    console.log('From:', confirmData.data.from_amount, confirmData.data.from_currency.toUpperCase());
    console.log('Received:', confirmData.data.received_amount, confirmData.data.to_currency.toUpperCase());
    console.log('Execution price:', confirmData.data.execution_price);

    // Record the swap in our database
    const { error: tradeError } = await supabaseAdmin
      .from('trades')
      .insert({
        user_id: profile.user_id,
        type: 'swap',
        market: `${fromCurrency}${toCurrency}`.toLowerCase(),
        amount: parseFloat(confirmData.data.from_amount),
        price: parseFloat(confirmData.data.execution_price),
        fee: 0, // We'll update this once we have fee calculation
        from_currency: confirmData.data.from_currency,
        to_currency: confirmData.data.to_currency,
        from_amount: parseFloat(confirmData.data.from_amount),
        to_amount: parseFloat(confirmData.data.received_amount),
        status: confirmData.data.status
      });

    if (tradeError) {
      console.error('Error recording trade:', tradeError);
    } else {
      console.log('\nTrade recorded successfully in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Test swap USDT to BTC (swapping half of available balance: 0.23 USDT)
testSwap('157fa815-214e-4ecd-8a25-448fe4815ff1', 'usdt', 'btc', '0.23'); 