const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const { resolve } = require('path');
const fetch = require('node-fetch');
const crypto = require('crypto');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function testGoogleOAuth() {
  try {
    console.log('Starting Google OAuth test...');

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get the OAuth URL from Supabase
    console.log('\nGetting Google OAuth URL...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    });

    if (error) {
      throw new Error(`Failed to get OAuth URL: ${error.message}`);
    }

    if (!data?.url) {
      throw new Error('No OAuth URL returned');
    }

    console.log('\n📱 Please open this URL in your browser to continue:');
    console.log('\x1b[36m%s\x1b[0m', data.url); // Print URL in cyan color

    // Wait for user to complete the OAuth flow
    console.log('\n⏳ Waiting for OAuth callback...');
    console.log('1. Complete the Google sign-in process in your browser');
    console.log('2. After signing in, you will be redirected to the dashboard');
    console.log('3. Once redirected, press Enter here to continue the test...');
    await new Promise(resolve => process.stdin.once('data', resolve));

    // Get the most recently created user
    console.log('\n🔍 Getting recently created user...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const user = users.users[0]; // Get most recent user
    if (!user) {
      throw new Error('No users found in Supabase auth');
    }

    console.log('✅ User found in auth:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });

    // Check profile and Quidax ID
    console.log('\n🔍 Checking user profile and Quidax ID...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to get user profile: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error('User profile not found');
    }

    console.log('✅ Profile found:', {
      user_id: profile.user_id,
      email: profile.email,
      quidax_id: profile.quidax_id,
      quidax_sn: profile.quidax_sn,
      created_at: profile.created_at
    });

    if (!profile.quidax_id) {
      throw new Error('❌ Quidax ID not found in user profile');
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('✨ User has been created with Quidax ID:', profile.quidax_id);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testGoogleOAuth(); 