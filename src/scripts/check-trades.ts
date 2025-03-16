const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * @typedef {Object} Trade
 * @property {string} id
 * @property {string} user_id
 * @property {string} type
 * @property {string} market
 * @property {string} from_currency
 * @property {string} to_currency
 * @property {number} from_amount
 * @property {number} to_amount
 * @property {number} price
 * @property {number} fee
 * @property {string} status
 * @property {string} created_at
 */

function formatCurrency(amount, currency) {
  if (currency === 'NGN') {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  }
  return `${amount} ${currency}`;
}

async function checkTrades() {
  try {
    console.log('Fetching all trades...\n');
    
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!trades || trades.length === 0) {
      console.log('No trades found in the database');
      return;
    }

    console.log(`Found ${trades.length} trades:\n`);
    console.log('----------------------------------------');

    trades.forEach((trade, index) => {
      console.log(`\nTrade ${index + 1}:`);
      console.log('ID:', trade.id);
      console.log('User ID:', trade.user_id);
      console.log('Type:', trade.type.toUpperCase());
      console.log('Market:', trade.market?.toUpperCase());
      
      if (trade.type === 'swap') {
        console.log('From:', formatCurrency(trade.from_amount, trade.from_currency?.toUpperCase()));
        console.log('To:', formatCurrency(trade.to_amount, trade.to_currency?.toUpperCase()));
        console.log('Rate:', trade.price);
      } else {
        console.log('Amount:', formatCurrency(trade.amount, trade.market?.slice(-3).toUpperCase()));
        console.log('Price:', formatCurrency(trade.price, 'NGN'));
      }
      
      console.log('Fee:', trade.fee);
      console.log('Status:', trade.status.toUpperCase());
      console.log('Date:', new Date(trade.created_at).toLocaleString());
      console.log('----------------------------------------');
    });

    // Print summary
    const summary = trades.reduce((acc, trade) => {
      acc.total++;
      acc.byType[trade.type] = (acc.byType[trade.type] || 0) + 1;
      acc.byStatus[trade.status] = (acc.byStatus[trade.status] || 0) + 1;
      return acc;
    }, { total: 0, byType: {}, byStatus: {} });

    console.log('\nSummary:');
    console.log('Total Trades:', summary.total);
    console.log('\nBy Type:');
    Object.entries(summary.byType).forEach(([type, count]) => {
      console.log(`- ${type.toUpperCase()}: ${count}`);
    });
    console.log('\nBy Status:');
    Object.entries(summary.byStatus).forEach(([status, count]) => {
      console.log(`- ${status.toUpperCase()}: ${count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTrades(); 