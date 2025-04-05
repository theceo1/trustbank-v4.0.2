const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const { resolve } = require('path');
const axios = require('axios');

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

console.log('Checking environment variables...');
console.log('SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('QUIDAX_SECRET_KEY:', !!process.env.QUIDAX_SECRET_KEY);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = 'admin@trustbank.tech';
const ADMIN_PASSWORD = 'trustbank123';
const baseUrl = 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: true
  }
});

// Create service role client for admin operations
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testWalletsEndpoint() {
  try {
    // 1. Authenticate admin user
    console.log('Authenticating admin...');
    const { data: { session }, error: authError } = 
      await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });

    if (authError) throw authError;

    // 2. Ensure admin role exists in user_profiles using service client
    console.log('Ensuring admin role in user_profiles...');
    const { data: profileData, error: profileError } = await serviceClient
      .from('user_profiles')
      .upsert({
        user_id: session.user.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .eq('user_id', session.user.id)
      .select('role')
      .single();

    if (profileError || !profileData || profileData.role !== 'admin') {
      throw new Error(`Failed to set admin role in user_profiles: ${profileError?.message}`);
    }

    // 3. Verify admin privileges in admin_users
    console.log('Verifying admin privileges...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('admin_roles(name, permissions)')
      .eq('user_id', session.user.id)
      .single();

    if (adminError || !adminData) {
      throw new Error('User does not have admin privileges');
    }

    // 4. Create properly formatted cookies with admin-session
    console.log('[TEST SCRIPT] Creating cookies...');
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    
    const adminSessionCookie = {
      role: 'super_admin',
      permissions: ['all'],
      userId: session.user.id
    };

    const cookieAttributes = [
      'Path=/',
      'SameSite=Lax',
      `Domain=localhost`,
      'HttpOnly',
      'Secure',
      `Max-Age=${maxAge}`
    ].join('; ');

    const cookies = [
      `sb-${session.user.id}-auth-token=${session.access_token}; ${cookieAttributes}`,
      `sb-auth-token=${session.access_token}; ${cookieAttributes}`,
      `sb-refresh-token=${session.refresh_token}; ${cookieAttributes}`,
      `admin-session=${encodeURIComponent(JSON.stringify(adminSessionCookie))}; ${cookieAttributes.replace('Path=/', 'Path=/admin')}`
    ].join('; ');

    console.log('[TEST SCRIPT] Session ID:', session.user.id);
    console.log('[TEST SCRIPT] Access Token:', session.access_token);
    console.log('[TEST SCRIPT] Cookies:', cookies);

    // Verify Quidax connection
    const subAccounts = await quidax.getSubAccounts();
    console.log('Quidax connection successful. Sub-accounts:', subAccounts.length);
    
    // 5. Test wallets endpoint with admin session
    console.log('[ADMIN MIDDLEWARE] Starting middleware check for path:', '/api/admin/wallets');
    
    try {
      const response = await axios.get(`${baseUrl}/api/admin/wallets`, {
        headers: {
          'Cookie': cookies,
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.data.status === 'error') {
        throw new Error(response.data.message);
      }
      
      console.log('[ADMIN MIDDLEWARE] Access granted for path:', '/api/admin/wallets');
      console.log('✅ Test passed:');
      console.log('Status:', response.status);
      console.log('Data:', response.data);
    } catch (error) {
      console.error('[ADMIN MIDDLEWARE] Test failed:', error.response?.data || error.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testWalletsEndpoint();
