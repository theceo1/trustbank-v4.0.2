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

async function checkSchema() {
  try {
    console.log('Fetching trades table schema...\n');

    // Get trades table details
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select()
      .limit(1);

    if (tradesError) {
      console.error('Error fetching trades table:', tradesError);
      return;
    }

    // Get a sample trade to examine the structure
    const { data: sampleTrade, error: sampleError } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Trades Table Structure:');
    console.log('----------------------------------------');
    
    if (sampleTrade) {
      console.log('\nColumns and their types:');
      Object.entries(sampleTrade).forEach(([column, value]) => {
        console.log(`- ${column}: ${typeof value} (${value === null ? 'NULL' : String(value)})`);
      });
    } else {
      console.log('No trades found in the table');
    }

    // Try to insert a test trade with fee
    const testTrade = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy ID
      type: 'swap',
      market: 'btcusdt',
      amount: 0.1,
      price: 50000,
      fee: 0.003, // 0.3%
      status: 'pending'
    };

    const { error: insertError } = await supabase
      .from('trades')
      .insert([testTrade])
      .select();

    if (insertError) {
      console.log('\nTest Insert Error:');
      console.log(insertError);
      
      if (insertError.message.includes('violates foreign key constraint')) {
        console.log('\nNote: Foreign key constraint indicates trades.user_id references auth.users(id)');
      }
      if (insertError.message.includes('violates check constraint')) {
        console.log('\nNote: Check constraint violation indicates there are value restrictions');
      }
      if (insertError.message.includes('null value in column')) {
        console.log('\nNote: NOT NULL constraint indicates required fields');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema(); 