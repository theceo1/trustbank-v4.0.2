const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const { resolve } = require('path');
const fetch = require('node-fetch');

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

// Function to calculate fee based on trading volume
async function calculateFee(userId, amount) {
  try {
    // Get user's 30-day trading volume
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: trades } = await supabaseAdmin
      .from('trades')
      .select('amount, price')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Calculate total trading volume
    const tradingVolume = trades?.reduce((total, trade) => {
      return total + (parseFloat(trade.amount) * parseFloat(trade.price));
    }, 0) || 0;

    // Determine fee tier based on volume
    let feePercentage = 0.03; // Default 3%
    if (tradingVolume >= 500000000) feePercentage = 0.01; // 500M+: 1%
    else if (tradingVolume >= 100000000) feePercentage = 0.015; // 100M+: 1.5%
    else if (tradingVolume >= 50000000) feePercentage = 0.02; // 50M+: 2%
    else if (tradingVolume >= 10000000) feePercentage = 0.025; // 10M+: 2.5%

    // Calculate fee amount
    return parseFloat(amount) * feePercentage;
  } catch (error) {
    console.error('Error calculating fee:', error);
    return parseFloat(amount) * 0.03; // Default to 3% if error
  }
}

async function testSwap(quidaxId, fromCurrency, toCurrency, amount) {
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

    const quotationData = await quotationResponse.json();
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

    const confirmData = await confirmResponse.json();
    console.log('\nSwap confirmed!');
    console.log('Status:', confirmData.data.status);
    console.log('From:', confirmData.data.from_amount, confirmData.data.from_currency.toUpperCase());
    console.log('Received:', confirmData.data.received_amount, confirmData.data.to_currency.toUpperCase());
    console.log('Execution price:', confirmData.data.execution_price);

    // Calculate fee
    const fee = await calculateFee(profile.user_id, confirmData.data.from_amount);
    console.log('Fee:', fee.toFixed(8), confirmData.data.from_currency.toUpperCase());

    // Record the swap in our database
    const { error: tradeError } = await supabaseAdmin
      .from('trades')
      .insert({
        user_id: profile.user_id,
        type: 'swap',
        market: `${fromCurrency}${toCurrency}`.toLowerCase(),
        amount: parseFloat(confirmData.data.from_amount),
        price: parseFloat(confirmData.data.execution_price),
        fee: fee,
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