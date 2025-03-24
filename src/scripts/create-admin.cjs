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

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Create the user with a different email
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
      email: 'admin@trustbank.tech',
      password: 'trustbank123',
      email_confirm: true,
      user_metadata: {
        name: 'System Admin'
      }
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return;
    }

    console.log('\nUser created successfully!');
    console.log('User ID:', user.id);

    // Create admin role if it doesn't exist
    const { data: roleData, error: roleError } = await supabase
      .from('admin_roles')
      .upsert({
        name: 'super_admin',
        permissions: [
          'view_users', 'manage_users', 'view_transactions', 'create_transaction',
          'approve_transaction', 'view_wallet', 'manage_wallet', 'withdraw',
          'submit_kyc', 'approve_kyc', 'view_admin_dashboard', 'manage_settings',
          'view_logs'
        ]
      }, {
        onConflict: 'name'
      })
      .select()
      .single();

    if (roleError) {
      console.error('Error creating role:', roleError);
      return;
    }

    console.log('\nRole created/updated successfully!');
    console.log('Role ID:', roleData.id);

    // Link user to admin role
    const { error: linkError } = await supabase
      .from('admin_users')
      .upsert({
        user_id: user.id,
        role_id: roleData.id
      }, {
        onConflict: 'user_id'
      });

    if (linkError) {
      console.error('Error linking user to role:', linkError);
      return;
    }

    console.log('\nUser linked to role successfully!');
    console.log('Setup complete!');

    // Try to sign in with the new user
    console.log('\nTesting login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@trustbank.tech',
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
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser(); 