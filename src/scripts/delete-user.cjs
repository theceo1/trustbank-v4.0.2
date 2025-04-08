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

async function deleteUser(email) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Delete from user_profiles first
    console.log('Deleting from user_profiles...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('email', email);
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
    } else {
      console.log('✅ Profile deleted successfully');
    }

    // Get user ID from email
    console.log('Finding user ID...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      console.log('⚠️ No user found with this email in auth.users');
      return;
    }

    // Delete from auth.users
    console.log('Deleting from auth.users...');
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
    } else {
      console.log('✅ Auth user deleted successfully');
    }

    console.log('🎉 User deletion completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    process.exit(0);
  }
}

// Delete the specified user
deleteUser('cursortt@gmail.com'); 