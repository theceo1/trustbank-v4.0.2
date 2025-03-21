const { createClient } = require('@supabase/supabase-js');

/**
 * @typedef {Object} Wallet
 * @property {string} id
 * @property {string} user_id
 * @property {string} currency
 * @property {string} balance
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} user_id
 * @property {string} type
 * @property {string} amount
 * @property {string} currency
 * @property {string} status
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [description]
 */

const SUPABASE_URL = 'https://xkxihvafbyegowhryojd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhreGlodmFmYnllZ293aHJ5b2pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzMzMzA5OCwiZXhwIjoyMDQ4OTA5MDk4fQ.7U8h9rBsrBlw9T2IV-x43iRQzxH2uhU4ip3cqnTuUys';
const QUIDAX_ID = '157fa815-214e-4ecd-8a25-448fe4815ff1';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findUserByQuidaxId() {
  try {
    console.log('\nLooking for user with Quidax ID:', QUIDAX_ID);
    
    // First check user_profiles
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, quidax_id, created_at')
      .eq('quidax_id', QUIDAX_ID)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return;
    }

    if (!userProfile) {
      console.log('User not found in user_profiles');
      return;
    }

    console.log('Found user in user_profiles:', userProfile);

    // Now check wallets
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userProfile.user_id);

    if (walletsError) {
      console.error('Error fetching wallets:', walletsError);
      return;
    }

    if (!wallets || wallets.length === 0) {
      console.log('No wallets found for user');
      return;
    }

    console.log('\nFound wallets:', wallets);

    // Check transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userProfile.user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (txError) {
      console.error('Error fetching transactions:', txError);
    } else {
      console.log('\nRecent transactions:', transactions);
    }

    // Check swap transactions
    const { data: swaps, error: swapError } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', userProfile.user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (swapError) {
      console.error('Error fetching swap transactions:', swapError);
    } else {
      console.log('\nRecent swap transactions:', swaps);
    }

    // Set up real-time monitoring
    await monitorRealtimeUpdates(userProfile.user_id, QUIDAX_ID);

  } catch (error) {
    console.error('Error in findUserByQuidaxId:', error);
  }
}

async function checkWalletBalances(quidaxId) {
  try {
    console.log('\nChecking wallet balances...');
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('quidax_wallet_id', quidaxId);

    if (error) {
      console.error('Error fetching wallets:', error);
      return;
    }

    if (!wallets || wallets.length === 0) {
      console.log('No wallets found');
      return;
    }

    console.log('Found wallets:', wallets);
    return wallets;
  } catch (error) {
    console.error('Error checking wallet balances:', error);
  }
}

async function checkTransactionHistory(userId) {
  try {
    console.log('\nChecking transaction history...');
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    if (!transactions || transactions.length === 0) {
      console.log('No transactions found');
      return;
    }

    console.log('Found transactions:', transactions);
    return transactions;
  } catch (error) {
    console.error('Error checking transaction history:', error);
  }
}

async function checkSwapTransactions(userId) {
  try {
    console.log('\nChecking swap transactions...');
    const { data: swaps, error } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching swap transactions:', error);
      return;
    }

    if (!swaps || swaps.length === 0) {
      console.log('No swap transactions found');
      return;
    }

    console.log('Found swap transactions:', swaps);
    return swaps;
  } catch (error) {
    console.error('Error checking swap transactions:', error);
  }
}

async function monitorRealtimeUpdates(userId, quidaxId) {
  console.log('\nSetting up real-time monitoring...');

  // Subscribe to wallet changes
  const walletSubscription = supabase
    .channel('wallet-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `quidax_wallet_id=eq.${quidaxId}`
      },
      (payload) => {
        console.log('Wallet update:', payload);
      }
    )
    .subscribe((status) => {
      console.log('Wallet subscription status:', status);
    });

  // Subscribe to transaction changes
  const transactionSubscription = supabase
    .channel('transaction-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Transaction update:', payload);
      }
    )
    .subscribe((status) => {
      console.log('Transaction subscription status:', status);
    });

  // Subscribe to swap transaction changes
  const swapSubscription = supabase
    .channel('swap-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'swap_transactions',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Swap update:', payload);
      }
    )
    .subscribe((status) => {
      console.log('Swap subscription status:', status);
    });

  return {
    walletSubscription,
    transactionSubscription,
    swapSubscription
  };
}

async function runTest() {
  try {
    // Find user by Quidax ID
    await findUserByQuidaxId();

    // Note: The rest of the functions are now called within findUserByQuidaxId()
    // after we have the correct user_id
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
runTest(); 