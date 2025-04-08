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

async function testSignup() {
  try {
    console.log('Starting signup test...');

    // Generate a unique email for testing using timestamp and random string
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const testEmail = `test${timestamp}${randomString}@trustbank.tech`;
    const testPassword = 'test123456';
    const testFirstName = 'Test';
    const testLastName = 'User';

    console.log('\nTest user details:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('First Name:', testFirstName);
    console.log('Last Name:', testLastName);

    // Make the signup request
    console.log('\nMaking signup request...');
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        firstName: testFirstName,
        lastName: testLastName
      })
    });

    const data = await response.json();
    console.log('\nSignup response:', {
      status: response.status,
      data: JSON.stringify(data, null, 2)
    });

    if (response.ok) {
      console.log('\nSignup successful!');
      console.log('User ID:', data.data.user.id);
      console.log('Quidax ID:', data.data.quidax_id);
      
      // Verify the user was created in Supabase
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      // Check auth user
      console.log('\nVerifying user in Supabase auth...');
      const { data: user, error } = await supabase.auth.admin.getUserById(data.data.user.id);
      
      if (error) {
        console.error('Error verifying user:', error);
      } else {
        console.log('User found in auth:', {
          id: user.user.id,
          email: user.user.email,
          created_at: user.user.created_at
        });
      }

      // Check profile
      console.log('\nChecking user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.data.user.id)
        .single();

      if (profileError) {
        console.error('Error checking profile:', profileError);
      } else {
        console.log('Profile found:', profile);
      }

    } else {
      console.error('\nSignup failed:', data.error);
      if (data.details) {
        console.error('Error details:', data.details);
      }

      // Check if email exists in auth
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      console.log('\nChecking if email exists in auth...');
      const { data: user, error } = await supabase.auth.admin.listUsers();
      const existingUser = user?.users?.find(u => u.email === testEmail);
      if (existingUser) {
        console.log('Email found in auth:', existingUser);
      } else {
        console.log('Email not found in auth');
      }

      // Check if email exists in profiles
      console.log('\nChecking if email exists in profiles...');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', testEmail)
        .single();

      if (profileError) {
        console.log('Email not found in profiles');
      } else {
        console.log('Email found in profiles:', profile);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testSignup(); 