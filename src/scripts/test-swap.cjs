const { config } = require('dotenv');
const { resolve } = require('path');
const fetch = require('node-fetch');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const QUIDAX_API_URL = process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;
const TEST_USER_ID = '157fa815-214e-4ecd-8a25-448fe4815ff1';

if (!QUIDAX_SECRET_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function getSwapQuote(userId, fromCurrency, toCurrency, fromAmount) {
  try {
    console.log(`Getting quote for swapping ${fromAmount} ${fromCurrency} to ${toCurrency}...`);
    
    const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/swap_quotation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from_currency: fromCurrency.toLowerCase(),
        to_currency: toCurrency.toLowerCase(),
        from_amount: fromAmount.toString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get swap quote: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting swap quote:', error);
    return null;
  }
}

async function confirmSwap(userId, quotationId) {
  try {
    console.log(`Confirming swap with quotation ID: ${quotationId}...`);
    
    const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/swap_quotation/${quotationId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to confirm swap: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error confirming swap:', error);
    return null;
  }
}

async function checkBalance(userId, currency) {
  try {
    const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/wallets/${currency}`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wallet: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching ${currency} balance:`, error);
    return null;
  }
}

async function getSwapTransactions(userId) {
  try {
    console.log('\nFetching swap transaction history...');
    const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/swap_transactions`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch swap transactions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching swap transactions:', error);
    return null;
  }
}

async function getSwapTransactionDetails(userId, swapTransactionId) {
  try {
    console.log(`\nFetching details for swap transaction: ${swapTransactionId}`);
    const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/swap_transactions/${swapTransactionId}`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch swap transaction details: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching swap transaction details:', error);
    return null;
  }
}

async function testSwap() {
  try {
    // Step 1: Check initial USDT balance
    console.log('\nChecking initial USDT balance...');
    const initialUsdtBalance = await checkBalance(TEST_USER_ID, 'usdt');
    console.log('Initial USDT Balance:', initialUsdtBalance?.balance);

    // Step 2: Get swap quote for USDT to SOL
    const fromAmount = '0.1'; // Swap 0.1 USDT to test
    const quote = await getSwapQuote(TEST_USER_ID, 'USDT', 'SOL', fromAmount);
    
    if (!quote) {
      console.log('Failed to get swap quote. Aborting test.');
      return;
    }

    console.log('\nSwap Quote Details:');
    console.log('From Amount:', quote.from_amount, quote.from_currency);
    console.log('To Amount:', quote.to_amount, quote.to_currency);
    console.log('Quote Expires At:', quote.expires_at);

    // Step 3: Confirm the swap
    const swapResult = await confirmSwap(TEST_USER_ID, quote.id);
    
    if (!swapResult) {
      console.log('Failed to confirm swap. Aborting test.');
      return;
    }

    console.log('\nSwap Confirmation Details:');
    console.log('Status:', swapResult.status);
    console.log('Transaction ID:', swapResult.id);

    // Step 4: Check final balances
    console.log('\nChecking final balances...');
    const finalUsdtBalance = await checkBalance(TEST_USER_ID, 'usdt');
    const solBalance = await checkBalance(TEST_USER_ID, 'sol');

    console.log('Final USDT Balance:', finalUsdtBalance?.balance);
    console.log('SOL Balance:', solBalance?.balance);

    // Step 5: Get transaction details
    if (swapResult.id) {
      const transactionDetails = await getSwapTransactionDetails(TEST_USER_ID, swapResult.id);
      if (transactionDetails) {
        console.log('\nDetailed Swap Transaction:');
        console.log('Status:', transactionDetails.status);
        console.log('From:', transactionDetails.from_amount, transactionDetails.from_currency);
        console.log('To:', transactionDetails.received_amount, transactionDetails.to_currency);
        console.log('Execution Price:', transactionDetails.execution_price);
        console.log('Created At:', transactionDetails.created_at);
        console.log('Updated At:', transactionDetails.updated_at);
      }
    }

    // Step 6: Get recent swap history
    const swapHistory = await getSwapTransactions(TEST_USER_ID);
    if (swapHistory && swapHistory.length > 0) {
      console.log('\nRecent Swap History:');
      swapHistory.slice(0, 5).forEach((swap, index) => {
        console.log(`\nTransaction ${index + 1}:`);
        console.log('ID:', swap.id);
        console.log('From:', swap.from_amount, swap.from_currency);
        console.log('To:', swap.received_amount, swap.to_currency);
        console.log('Status:', swap.status);
        console.log('Date:', swap.created_at);
      });
    } else {
      console.log('\nNo recent swap history found.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testSwap(); 