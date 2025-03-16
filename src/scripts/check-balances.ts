require('dotenv').config();

const QUIDAX_API_URL = 'https://www.quidax.com/api/v1';
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

if (!QUIDAX_SECRET_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function checkBalances(quidaxId: string) {
  try {
    console.log('Fetching BTC and USDT balances for Quidax ID:', quidaxId);
    
    const response = await fetch(`${QUIDAX_API_URL}/users/${quidaxId}/wallets`, {
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wallets: ${response.statusText}`);
    }

    const data = await response.json();
    const wallets = data.data.filter((wallet: any) => 
      ['btc', 'usdt'].includes(wallet.currency.toLowerCase())
    );

    console.log('\nFiltered Wallet Balances:');
    wallets.forEach((wallet: any) => {
      console.log(`\n${wallet.currency.toUpperCase()} Wallet:`);
      console.log(`Balance: ${wallet.balance}`);
      console.log(`Locked: ${wallet.locked}`);
      if (wallet.address) {
        console.log(`Address: ${wallet.address}`);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Check balances for the test user
checkBalances('157fa815-214e-4ecd-8a25-448fe4815ff1'); 