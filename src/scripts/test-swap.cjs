const { config } = require('dotenv');
const { resolve } = require('path');
const fetch = require('node-fetch');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const QUIDAX_API_URL = process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

if (!QUIDAX_SECRET_KEY) {
  console.error('Missing QUIDAX_SECRET_KEY environment variable');
  process.exit(1);
}

// Test user credentials
const TEST_USER_ID = '157fa815-214e-4ecd-8a25-448fe4815ff1';
const fromAmount = 0.2; // Reduced from 10 to 0.2 USDT

async function checkBalance(userId, currency) {
  try {
    console.log(`Checking ${currency} balance for user ${userId}...`);
    const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/wallets/${currency.toLowerCase()}`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get balance: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`${currency} Balance:`, data.data.balance);
    return data.data;
  } catch (error) {
    console.error(`Error checking ${currency} balance:`, error);
    return null;
  }
}

async function getTemporarySwapQuote(userId, fromCurrency, toCurrency, fromAmount) {
  try {
    console.log(`Getting temporary swap quote for ${fromAmount} ${fromCurrency} to ${toCurrency}...`);
    const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/instant_orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bid: toCurrency.toLowerCase(),
        ask: fromCurrency.toLowerCase(),
        type: 'buy',
        total: fromAmount.toString(),
        unit: 'quote'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get temporary swap quote: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Temporary Quote:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error getting temporary swap quote:', error);
    return null;
  }
}

async function getSwapQuote(userId, fromCurrency, toCurrency, fromAmount) {
  try {
    console.log(`Getting swap quote for ${fromAmount} ${fromCurrency} to ${toCurrency}...`);
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
      const errorData = await response.json();
      throw new Error(`Failed to get swap quote: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Swap Quote:', data.data);
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
      const errorData = await response.json();
      throw new Error(`Failed to confirm swap: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Swap Confirmation:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error confirming swap:', error);
    return null;
  }
}

async function getSwapTransactionDetails(userId, swapTransactionId) {
  try {
    console.log(`Getting swap transaction details for ID: ${swapTransactionId}...`);
    const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/swap_transactions/${swapTransactionId}`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get transaction details: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Transaction Details:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error getting transaction details:', error);
    return null;
  }
}

async function getSwapHistory(userId) {
  try {
    console.log(`Getting swap history for user ${userId}...`);
    const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/swap_transactions`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get swap history: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Recent Swap History:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error getting swap history:', error);
    return null;
  }
}

async function testSwap() {
  try {
    console.log('\n=== Starting Swap Test ===\n');

    // Check initial USDT balance
    const initialUsdtBalance = await checkBalance(TEST_USER_ID, 'USDT');
    if (!initialUsdtBalance || parseFloat(initialUsdtBalance.balance) < fromAmount) {
      throw new Error(`Insufficient USDT balance. Required: ${fromAmount}, Available: ${initialUsdtBalance?.balance || 0}`);
    }

    // Check initial BTC balance
    const initialBtcBalance = await checkBalance(TEST_USER_ID, 'BTC');
    console.log('\nInitial Balances:', {
      USDT: initialUsdtBalance.balance,
      BTC: initialBtcBalance.balance
    });

    // Get swap quote
    console.log('\nGetting swap quote...');
    const quote = await getSwapQuote(TEST_USER_ID, 'USDT', 'BTC', fromAmount);
    if (!quote) {
      throw new Error('Failed to get swap quote');
    }

    // Confirm the swap
    console.log('\nConfirming swap...');
    const confirmation = await confirmSwap(TEST_USER_ID, quote.id);
    if (!confirmation) {
      throw new Error('Failed to confirm swap');
    }

    // Get transaction details
    console.log('\nGetting transaction details...');
    const transactionDetails = await getSwapTransactionDetails(TEST_USER_ID, confirmation.id);
    if (!transactionDetails) {
      throw new Error('Failed to get transaction details');
    }

    // Check final balances
    console.log('\nChecking final balances...');
    const finalUsdtBalance = await checkBalance(TEST_USER_ID, 'USDT');
    const finalBtcBalance = await checkBalance(TEST_USER_ID, 'BTC');
    
    console.log('\nBalance Changes:', {
      USDT: {
        before: initialUsdtBalance.balance,
        after: finalUsdtBalance.balance,
        change: parseFloat(finalUsdtBalance.balance) - parseFloat(initialUsdtBalance.balance)
      },
      BTC: {
        before: initialBtcBalance.balance,
        after: finalBtcBalance.balance,
        change: parseFloat(finalBtcBalance.balance) - parseFloat(initialBtcBalance.balance)
      }
    });

    // Get recent swap history
    console.log('\nGetting swap history...');
    await getSwapHistory(TEST_USER_ID);

    console.log('\n=== Swap Test Completed Successfully ===\n');
  } catch (error) {
    console.error('\nSwap Test Failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSwap();