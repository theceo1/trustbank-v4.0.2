// src/scripts/test-swap-usdt-btc.cjs
const { config } = require('dotenv');
const { resolve } = require('path');
const fetch = require('node-fetch');

config({ path: resolve(process.cwd(), '.env.local') });

const QUIDAX_API_URL = process.env.NEXT_PUBLIC_QUIDAX_API_URL || 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;
const TEST_USER_ID = '157fa815-214e-4ecd-8a25-448fe4815ff1';

// Smallest trade: 0.2 USDT (about 300 NGN worth)
const fromAmount = 0.2;
const FROM_CURRENCY = 'usdt';
const TO_CURRENCY = 'btc';

async function checkBalance(userId, currency) {
  console.log(`Checking ${currency.toUpperCase()} balance for user ${userId}...`);
  const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/wallets/${currency}`, {
    headers: {
      'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Failed to get balance: ${data.message || response.statusText}`);
  console.log(`${currency.toUpperCase()} Balance:`, data.data.balance);
  return data.data;
}

async function getSwapQuote(userId, fromCurrency, toCurrency, fromAmount) {
  console.log(`Getting swap quote for ${fromAmount} ${fromCurrency.toUpperCase()} to ${toCurrency.toUpperCase()}...`);
  const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/swap_quotation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from_currency: fromCurrency,
      to_currency: toCurrency,
      from_amount: fromAmount.toString()
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Failed to get swap quote: ${data.message || response.statusText}`);
  console.log('Swap Quote:', data.data);
  return data.data;
}

async function confirmSwap(userId, quotationId) {
  console.log(`Confirming swap with quotation ID: ${quotationId}...`);
  const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/swap_quotation/${quotationId}/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Failed to confirm swap: ${data.message || response.statusText}`);
  console.log('Swap Confirmation:', data.data);
  return data.data;
}

async function getSwapTransactionDetails(userId, swapTransactionId) {
  console.log(`Getting swap transaction details for ID: ${swapTransactionId}...`);
  const response = await fetch(`${QUIDAX_API_URL}/users/${userId}/swap_transactions/${swapTransactionId}`, {
    headers: {
      'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Failed to get transaction details: ${data.message || response.statusText}`);
  console.log('Transaction Details:', data.data);
  return data.data;
}

async function testSwap() {
  try {
    console.log('\n=== Starting USDT→BTC Swap Test ===\n');

    // 1. Check initial balances
    const initialFromBalance = await checkBalance(TEST_USER_ID, FROM_CURRENCY);
    const initialToBalance = await checkBalance(TEST_USER_ID, TO_CURRENCY);

    if (!initialFromBalance || parseFloat(initialFromBalance.balance) < fromAmount) {
      throw new Error(`Insufficient ${FROM_CURRENCY.toUpperCase()} balance. Required: ${fromAmount}, Available: ${initialFromBalance?.balance || 0}`);
    }

    // 2. Get swap quote
    const quote = await getSwapQuote(TEST_USER_ID, FROM_CURRENCY, TO_CURRENCY, fromAmount);

    // 3. Confirm the swap within 14 seconds
    const confirmation = await confirmSwap(TEST_USER_ID, quote.id);

    // 4. Get transaction details
    const transactionDetails = await getSwapTransactionDetails(TEST_USER_ID, confirmation.id);

    // 5. Check final balances
    const finalFromBalance = await checkBalance(TEST_USER_ID, FROM_CURRENCY);
    const finalToBalance = await checkBalance(TEST_USER_ID, TO_CURRENCY);

    // 6. Print balance changes
    console.log('\nBalance Changes:', {
      [FROM_CURRENCY.toUpperCase()]: {
        before: initialFromBalance.balance,
        after: finalFromBalance.balance,
        change: parseFloat(finalFromBalance.balance) - parseFloat(initialFromBalance.balance)
      },
      [TO_CURRENCY.toUpperCase()]: {
        before: initialToBalance.balance,
        after: finalToBalance.balance,
        change: parseFloat(finalToBalance.balance) - parseFloat(initialToBalance.balance)
      }
    });

    console.log('\n=== USDT→BTC Swap Test Completed Successfully ===\n');
  } catch (error) {
    console.error('\nSwap Test Failed:', error.message);
    process.exit(1);
  }
}

testSwap();
