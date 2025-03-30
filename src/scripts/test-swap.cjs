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
const fromAmount = 0.0000015; // Increased to meet minimum USDT value of 0.1
const FROM_CURRENCY = 'BTC';
const TO_CURRENCY = 'USDT';

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

async function testSwap() {
  try {
    console.log('\n=== Starting Swap Test ===\n');

    // Check initial balances
    const initialFromBalance = await checkBalance(TEST_USER_ID, FROM_CURRENCY);
    const initialToBalance = await checkBalance(TEST_USER_ID, TO_CURRENCY);
    
    if (!initialFromBalance || parseFloat(initialFromBalance.balance) < fromAmount) {
      throw new Error(`Insufficient ${FROM_CURRENCY} balance. Required: ${fromAmount}, Available: ${initialFromBalance?.balance || 0}`);
    }

    console.log('\nInitial Balances:', {
      [FROM_CURRENCY]: initialFromBalance.balance,
      [TO_CURRENCY]: initialToBalance.balance
    });

    // Get swap quote
    console.log('\nGetting swap quote...');
    const quote = await getSwapQuote(TEST_USER_ID, FROM_CURRENCY, TO_CURRENCY, fromAmount);
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
    const finalFromBalance = await checkBalance(TEST_USER_ID, FROM_CURRENCY);
    const finalToBalance = await checkBalance(TEST_USER_ID, TO_CURRENCY);
    
    console.log('\nBalance Changes:', {
      [FROM_CURRENCY]: {
        before: initialFromBalance.balance,
        after: finalFromBalance.balance,
        change: parseFloat(finalFromBalance.balance) - parseFloat(initialFromBalance.balance)
      },
      [TO_CURRENCY]: {
        before: initialToBalance.balance,
        after: finalToBalance.balance,
        change: parseFloat(finalToBalance.balance) - parseFloat(initialToBalance.balance)
      }
    });

    console.log('\n=== Swap Test Completed Successfully ===\n');
  } catch (error) {
    console.error('\nSwap Test Failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSwap();