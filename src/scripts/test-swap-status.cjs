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

async function getSwapTransactionDetails(userId, swapTransactionId) {
  try {
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

async function monitorSwapStatus(userId, swapId) {
  console.log(`\nStarting to monitor swap transaction: ${swapId}`);
  console.log('Will check status every 5 seconds for 2 minutes...\n');

  let attempts = 0;
  const maxAttempts = 24; // 2 minutes with 5-second intervals
  
  while (attempts < maxAttempts) {
    const transactionDetails = await getSwapTransactionDetails(userId, swapId);
    
    if (!transactionDetails) {
      console.log('Failed to fetch transaction details. Retrying...');
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }

    const status = transactionDetails.status;
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] Status: ${status}`);
    console.log('From:', transactionDetails.from_amount, transactionDetails.from_currency);
    console.log('To:', transactionDetails.received_amount, transactionDetails.to_currency);
    
    // Check balances
    const fromBalance = await checkBalance(userId, transactionDetails.from_currency.toLowerCase());
    const toBalance = await checkBalance(userId, transactionDetails.to_currency.toLowerCase());
    
    console.log(`${transactionDetails.from_currency} Balance:`, fromBalance?.balance);
    console.log(`${transactionDetails.to_currency} Balance:`, toBalance?.balance);
    console.log('-------------------');

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      console.log(`\nSwap has reached final status: ${status}`);
      return transactionDetails;
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\nMonitoring timeout reached. Last known status will be returned.');
  return await getSwapTransactionDetails(userId, swapId);
}

// Get transaction ID from command line argument or use the most recent one from the test
const transactionId = process.argv[2] || '26aa4b1d-3efb-4437-8f5c-7c164d1cede7';

// Start monitoring
monitorSwapStatus(TEST_USER_ID, transactionId)
  .then(finalStatus => {
    if (finalStatus) {
      console.log('\nFinal Transaction Details:');
      console.log('Status:', finalStatus.status);
      console.log('From:', finalStatus.from_amount, finalStatus.from_currency);
      console.log('To:', finalStatus.received_amount, finalStatus.to_currency);
      console.log('Execution Price:', finalStatus.execution_price);
      console.log('Created At:', finalStatus.created_at);
      console.log('Updated At:', finalStatus.updated_at);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Error monitoring swap:', error);
    process.exit(1);
  }); 