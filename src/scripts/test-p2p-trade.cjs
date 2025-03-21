const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { config } = require('dotenv');
const { resolve } = require('path');
const fetch = require('node-fetch');
const { authenticator } = require('otplib');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Constants
const SELLER_EMAIL = 'test1735848851306@trustbank.tech';
const SELLER_PASSWORD = 'trustbank123';
const SELLER_QUIDAX_ID = '157fa815-214e-4ecd-8a25-448fe4815ff1';
const BUYER_EMAIL = `test_buyer_${Date.now()}@trustbank.tech`;
const BUYER_PASSWORD = 'password123';

// Set base URL from site URL
process.env.NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

// Logging utility
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function waitForProfile(userId) {
  const maxAttempts = 10;
  const delayMs = 2000;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    log(`Waiting for profile to be created (attempt ${attempt}/${maxAttempts})...`);
    
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      log(`Error checking for profile:`, error);
    } else if (profile) {
      log('Profile found');
      return profile;
    }
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error('Profile not created after 10 attempts');
}

async function signIn(email, password) {
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;
    log('Signed in successfully', { userId: user.id });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      log('Error getting user profile:', profileError);
      throw profileError;
    }

    return { user, profile };
  } catch (error) {
    log('Error signing in:', error);
    throw error;
  }
}

async function createUserWithKYC(email, password) {
  try {
    // Create auth user first
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;
    log('Auth user created successfully', { userId: user.id });

    // Create user record and profile using create_user_record function
    const { error: createError } = await supabaseAdmin.rpc('create_user_record', {
      user_id: user.id,
      user_email: user.email
    });

    if (createError) {
      log('Error creating user record:', createError);
      throw createError;
    }
    log('User record and profile created successfully');

    // Update the profile with KYC tier 1
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        kyc_level: 'intermediate',
        quidax_user_id: `test_${Date.now()}`
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      log('Error updating user profile:', updateError);
      throw updateError;
    }
    log('User profile updated successfully');

    return { buyer: user, buyerProfile: updatedProfile };
  } catch (error) {
    log('Error creating user with KYC:', error);
    throw error;
  }
}

async function setup2FA(userId) {
  try {
    log(`Setting up 2FA for user ${userId}...`);
    
    // Check if 2FA is already enabled
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('security_settings')
      .select('two_factor_enabled, two_factor_secret')
      .eq('user_id', userId)
      .single();

    if (settingsError) throw settingsError;

    if (settings.two_factor_enabled) {
      log('2FA already enabled');
      return settings.two_factor_secret;
    }

    // Generate new secret
    const secret = authenticator.generateSecret();
    
    // Update security settings
    const { error: updateError } = await supabaseAdmin
      .from('security_settings')
      .update({
        two_factor_enabled: true,
        two_factor_secret: secret
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;
    log('2FA enabled successfully');

    return secret;
  } catch (error) {
    log('2FA setup error:', error);
    throw error;
  }
}

async function createSellOrder(session, secret, profile) {
  try {
    log('Creating sell order...');
    
    // Generate 2FA token
    const token = authenticator.generate(secret);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/trades/p2p/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'x-2fa-token': token,
        'x-quidax-id': profile.quidax_user_id
      },
      body: JSON.stringify({
        type: 'sell',
        currency: 'USDT',
        amount: '100',
        price: '1200',
        min_order: '10',
        max_order: '100',
        payment_methods: ['bank_transfer'],
        terms: 'Please pay to the provided bank account within 30 minutes'
      })
    });

    const data = await response.json();
    log('Sell order response:', data);

    if (!response.ok) {
      log('Sell order error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(`Failed to create sell order: ${data.error}`);
    }

    return data.data;
  } catch (error) {
    log('Create sell order error:', {
      message: error.message,
      status: error.status,
      name: error.name,
      details: error.details,
      stack: error.stack
    });
    throw error;
  }
}

async function createBuyOrder(session, secret, profile, sellOrder) {
  try {
    log('Creating buy order...');
    
    const token = authenticator.generate(secret);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/trades/p2p/trades`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'x-2fa-token': token,
        'x-quidax-id': profile.quidax_user_id
      },
      body: JSON.stringify({
        order_id: sellOrder.id,
        amount: '50'
      })
    });

    const data = await response.json();
    log('Buy order response:', data);

    if (!response.ok) {
      throw new Error(`Failed to create buy order: ${data.error}`);
    }

    return data.data;
  } catch (error) {
    log('Create buy order error:', error);
    throw error;
  }
}

async function confirmPayment(session, secret, profile, tradeId) {
  try {
    log(`Confirming payment for trade ${tradeId}...`);
    
    const token = authenticator.generate(secret);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/trades/p2p/trades/${tradeId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'x-2fa-token': token,
        'x-quidax-id': profile.quidax_user_id
      },
      body: JSON.stringify({
        payment_proof: 'bank_transfer_receipt.jpg'
      })
    });

    const data = await response.json();
    log('Payment confirmation response:', data);

    if (!response.ok) {
      throw new Error(`Failed to confirm payment: ${data.error}`);
    }

    return data.data;
  } catch (error) {
    log('Confirm payment error:', error);
    throw error;
  }
}

async function completeTrade(session, secret, profile, tradeId) {
  try {
    log(`Completing trade ${tradeId}...`);
    
    const token = authenticator.generate(secret);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/trades/p2p/trades/${tradeId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'x-2fa-token': token,
        'x-quidax-id': profile.quidax_user_id
      }
    });

    const data = await response.json();
    log('Trade completion response:', data);

    if (!response.ok) {
      throw new Error(`Failed to complete trade: ${data.error}`);
    }

    return data.data;
  } catch (error) {
    log('Complete trade error:', error);
    throw error;
  }
}

async function checkTradeStatus(session, secret, profile, tradeId) {
  try {
    log(`Checking status for trade ${tradeId}...`);
    
    const token = authenticator.generate(secret);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/trades/p2p/trades/${tradeId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'x-2fa-token': token,
        'x-quidax-id': profile.quidax_user_id
      }
    });

    const data = await response.json();
    log('Trade status:', data);

    if (!response.ok) {
      throw new Error(`Failed to check trade status: ${data.error}`);
    }

    return data.data;
  } catch (error) {
    log('Check trade status error:', error);
    throw error;
  }
}

async function createSellerIfNotExists() {
  try {
    log('Checking if seller exists...');
    
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD
    });

    if (!signInError) {
      log('Seller already exists');
      return;
    }

    // Create seller if sign in fails
    log('Creating seller account...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
      email_confirm: true
    });

    if (authError) throw authError;
    log('Auth user created successfully', { userId: authData.user.id });

    // Update user profile with Quidax ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        kyc_level: 'intermediate',
        quidax_user_id: '157fa815-214e-4ecd-8a25-448fe4815ff1',
        first_name: 'Test',
        last_name: 'Seller',
        phone_number: '+2348012345678'
      })
      .eq('user_id', authData.user.id)
      .select()
      .single();

    if (profileError) throw profileError;
    log('Seller profile updated with KYC tier 1', profile);
  } catch (error) {
    log('Error creating seller:', error);
    throw error;
  }
}

async function main() {
  try {
    log('Starting P2P trade test...');

    // Check if seller exists
    log('Checking if seller exists...');
    const { user: seller, profile: sellerProfile } = await signIn(SELLER_EMAIL, SELLER_PASSWORD);
    
    // Verify seller's Quidax ID
    if (sellerProfile.quidax_user_id !== SELLER_QUIDAX_ID) {
      log('Updating seller Quidax ID...');
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ quidax_user_id: SELLER_QUIDAX_ID })
        .eq('user_id', seller.id);

      if (updateError) {
        log('Error updating seller Quidax ID:', updateError);
        throw updateError;
      }
      log('Seller Quidax ID updated successfully');
    } else {
      log('Seller exists with correct Quidax ID');
    }

    // Create new buyer account with KYC tier 1
    const { buyer, buyerProfile } = await createUserWithKYC(BUYER_EMAIL, BUYER_PASSWORD);
    log('Created new buyer account with KYC tier 1', { userId: buyer.id });

    // TODO: Create P2P trade between seller and buyer
  } catch (error) {
    log('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
main(); 