'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

interface Profile {
  id: string;
  user_id: string;
  quidax_id: string;
  kyc_verified: boolean;
  created_at: string;
  updated_at: string;
  two_factor_enabled: boolean;
  total_referrals: number;
  active_referrals: number;
  referral_earnings: number;
  pending_earnings: number;
  referral_code: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) throw profileError;
        
        if (mounted) {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile();
      } else if (mounted) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { profile, loading, error };
} 