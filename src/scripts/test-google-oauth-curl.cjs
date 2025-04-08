const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const { resolve } = require('path');
const fetch = require('node-fetch');
const crypto = require('crypto');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const QUIDAX_SECRET_KEY = process.env.QUIDAX_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !QUIDAX_SECRET_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function testGoogleOAuth() {
  try {
    console.log('Starting Google OAuth test...');

    // Initialize Supabase client with admin privileges
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate a test email
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const testEmail = `test${timestamp}${randomString}@gmail.com`;
    const firstName = 'Test';
    const lastName = 'User';

    // Create a test user in Supabase with Google-like metadata
    console.log('\nCreating test user...');
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      email_confirm: true,
      user_metadata: {
        email_verified: true,
        full_name: `${firstName} ${lastName}`,
        name: `${firstName} ${lastName}`,
        provider: 'google',
        provider_id: `google_${randomString}`,
        avatar_url: null
      }
    });

    if (createError) {
      throw new Error(`Failed to create test user: ${createError.message}`);
    }

    console.log('✅ Test user created:', {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    });

    // Create Quidax account with proper fields
    console.log('\nCreating Quidax account...');
    const quidaxResponse = await fetch('https://www.quidax.com/api/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        metadata: {
          source: 'google',
          provider_id: `google_${randomString}`,
          email_verified: true
        }
      })
    });

    const quidaxResult = await quidaxResponse.json();
    
    if (!quidaxResponse.ok) {
      console.error('Quidax API Error:', {
        status: quidaxResponse.status,
        statusText: quidaxResponse.statusText,
        headers: Object.fromEntries(quidaxResponse.headers.entries()),
        body: quidaxResult
      });
      throw new Error(`Failed to create Quidax account: ${JSON.stringify(quidaxResult)}`);
    }

    console.log('✅ Quidax account created:', quidaxResult.data);

    // Update user profile with Quidax ID
    console.log('\nUpdating user profile...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        email: user.email,
        quidax_id: quidaxResult.data.id,
        quidax_sn: quidaxResult.data.id,
        referral_code: crypto.randomBytes(8).toString('hex'),
        kyc_level: 'basic',
        kyc_verified: false,
        verification_history: {
          email: true,
          phone: false,
          basic_info: false,
          identity: false,
          address: false
        }
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      throw new Error(`Failed to update user profile: ${profileError.message}`);
    }

    console.log('✅ User profile updated');

    // Verify the profile was created correctly
    console.log('\nVerifying profile...');
    const { data: profile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify profile: ${verifyError.message}`);
    }

    console.log('✅ Profile verified:', {
      user_id: profile.user_id,
      email: profile.email,
      quidax_id: profile.quidax_id,
      quidax_sn: profile.quidax_sn
    });

    // Test getting wallets from Quidax
    console.log('\nTesting wallet access...');
    const walletsResponse = await fetch(`https://www.quidax.com/api/v1/users/${quidaxResult.data.id}/wallets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${QUIDAX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!walletsResponse.ok) {
      throw new Error(`Failed to get wallets: ${walletsResponse.statusText}`);
    }

    const walletsData = await walletsResponse.json();
    console.log('✅ Wallets accessible:', {
      count: walletsData.data.length,
      currencies: walletsData.data.map(w => w.currency)
    });

    console.log('\n🎉 Test completed successfully!');
    console.log('✨ User created with Quidax ID:', profile.quidax_id);
    console.log('\nTest credentials:');
    console.log('Email:', testEmail);
    console.log('Quidax ID:', quidaxResult.data.id);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error.response) {
      console.error('Response details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
  } finally {
    process.exit(0);
  }
}

testGoogleOAuth(); 