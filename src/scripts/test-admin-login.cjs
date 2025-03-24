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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAdminLogin() {
  try {
    console.log('Checking admin user in database...');

    // First check if the user exists in the database
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        user_id,
        admin_roles (
          name,
          permissions
        )
      `);

    if (adminError) {
      console.error('\nError checking admin users:', adminError);
      return;
    }

    console.log('\nAdmin users found:', adminUsers.length);
    console.log('Admin users:', JSON.stringify(adminUsers, null, 2));

    // Check auth.users table using RPC
    console.log('\nChecking auth.users table...');
    const { data: authUser, error: rpcError } = await supabase.rpc('check_auth_user', {
      p_email: 'superadmin@trustbank.tech'
    });

    if (rpcError) {
      console.error('\nError checking auth user:', rpcError);
      
      // Try to create the function if it doesn't exist
      console.log('\nAttempting to create helper function...');
      const { error: createError } = await supabase.rpc('create_auth_check_function', {
        sql: `
          CREATE OR REPLACE FUNCTION check_auth_user(p_email TEXT)
          RETURNS TABLE (
            id uuid,
            email text,
            email_confirmed_at timestamptz,
            last_sign_in_at timestamptz,
            raw_app_meta_data jsonb,
            raw_user_meta_data jsonb
          )
          SECURITY DEFINER
          SET search_path = auth, public
          LANGUAGE plpgsql
          AS $$
          BEGIN
            RETURN QUERY
            SELECT 
              u.id,
              u.email,
              u.email_confirmed_at,
              u.last_sign_in_at,
              u.raw_app_meta_data,
              u.raw_user_meta_data
            FROM auth.users u
            WHERE u.email = p_email;
          END;
          $$;
        `
      });

      if (createError) {
        console.error('\nError creating helper function:', createError);
        return;
      }

      // Try the check again
      const { data: retryUser, error: retryError } = await supabase.rpc('check_auth_user', {
        p_email: 'superadmin@trustbank.tech'
      });

      if (retryError) {
        console.error('\nError on retry:', retryError);
        return;
      }

      console.log('\nAuth user found:', retryUser ? 'Yes' : 'No');
      if (retryUser) {
        console.log('Auth user details:', JSON.stringify(retryUser, null, 2));
      }
    } else {
      console.log('\nAuth user found:', authUser ? 'Yes' : 'No');
      if (authUser) {
        console.log('Auth user details:', JSON.stringify(authUser, null, 2));
      }
    }

    console.log('\nTesting login...');

    // Try to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@trustbank.tech',
      password: 'trustbank123'
    });

    if (authError) {
      console.error('\nLogin Error:', authError);
      return;
    }

    console.log('\nLogin successful!');
    console.log('Session:', authData.session ? 'Created' : 'Not created');
    
    if (authData.user) {
      console.log('Logged in user ID:', authData.user.id);
      console.log('Email verified:', authData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('Last sign in:', authData.user.last_sign_in_at);

      // Check admin role
      const { data: roleData, error: roleError } = await supabase
        .from('admin_users')
        .select(`
          admin_roles (
            name,
            permissions
          )
        `)
        .eq('user_id', authData.user.id)
        .single();

      if (roleError) {
        console.error('\nError fetching role:', roleError);
      } else {
        console.log('\nRole information:');
        console.log('Role:', roleData?.admin_roles?.name);
        console.log('Permissions:', roleData?.admin_roles?.permissions);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testAdminLogin(); 