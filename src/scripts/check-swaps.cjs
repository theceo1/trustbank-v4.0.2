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

async function checkSwaps() {
  try {
    console.log('Checking swap_transactions table:');
    const { data: swapTxs, error: swapError } = await supabase
      .from('swap_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (swapError) {
      console.error('Error fetching swap transactions:', swapError);
    } else {
      console.log('\nFound', swapTxs?.length || 0, 'swap transactions:');
      console.log(JSON.stringify(swapTxs, null, 2));
    }

    console.log('\nChecking trades table for swaps:');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('type', 'swap')
      .order('created_at', { ascending: false });

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
    } else {
      console.log('\nFound', trades?.length || 0, 'swap trades:');
      console.log(JSON.stringify(trades, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSwaps(); 