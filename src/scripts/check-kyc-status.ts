import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateBasicVerification(quidaxId: string) {
  try {
    console.log('Searching for user profile with Quidax ID:', quidaxId);
    
    // First try to find the user profile by Quidax ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('quidax_id', quidaxId)
      .single();

    if (profileError) {
      console.error('Error finding profile by Quidax ID:', profileError);
      return;
    }

    if (!profile) {
      console.error('No profile found with Quidax ID:', quidaxId);
      return;
    }

    // Update verification history for basic tier
    const verificationHistory = {
      email: true,
      phone: true,
      basic_info: true
    };

    // Update the user's profile with verification history and set tier to TIER_1
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        verification_history: verificationHistory,
        kyc_tier: 'TIER_1',
        last_verification_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }

    console.log('Successfully updated verification status:', updatedProfile);

    // Create verification request records
    const verificationTypes = ['email', 'phone', 'basic_info'];
    for (const type of verificationTypes) {
      const { error: requestError } = await supabaseAdmin
        .from('verification_requests')
        .insert({
          user_id: profile.user_id,
          verification_type: type,
          requested_tier: 'TIER_1',
          status: 'approved',
          metadata: {
            completed_at: new Date().toISOString(),
            source: 'admin_verified'
          }
        });

      if (requestError) {
        console.error(`Error creating verification request for ${type}:`, requestError);
      }
    }

    console.log('Basic verification completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Update basic verification for the test user
updateBasicVerification('157fa815-214e-4ecd-8a25-448fe4815ff1'); 