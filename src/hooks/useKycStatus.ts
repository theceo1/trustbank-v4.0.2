'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useKycStatus() {
  const [hasBasicKyc, setHasBasicKyc] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkKyc = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        // Get user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;
        if (!profile) throw new Error('Profile not found');

        // Check if user has completed basic KYC
        const isBasicKycVerified = profile.verification_history?.nin || 
                                 profile.verification_history?.bvn ||
                                 (profile.verification_history?.email && 
                                  profile.verification_history?.phone && 
                                  profile.verification_history?.basic_info);
        
        setHasBasicKyc(isBasicKycVerified);
      } catch (error) {
        console.error('Error checking KYC status:', error);
        setHasBasicKyc(false);
      } finally {
        setLoading(false);
      }
    };

    checkKyc();
  }, []);

  return { hasBasicKyc, loading };
} 