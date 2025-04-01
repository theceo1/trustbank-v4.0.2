import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  user_id: string;
  quidax_id?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email_verified?: boolean;
  kyc_status?: string;
  created_at?: string;
  updated_at?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, isInitialized: isAuthInitialized } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!user) {
        if (mounted) {
          setProfile(null);
          setIsInitialized(true);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (mounted) {
          if (error) {
            console.error('Error fetching profile:', error);
            setProfile(null);
          } else {
            setProfile(data);
          }
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (mounted) {
          setProfile(null);
          setIsInitialized(true);
        }
      }
    };

    // Only fetch profile if auth is initialized
    if (isAuthInitialized) {
      fetchProfile();
    }

    return () => {
      mounted = false;
    };
  }, [user, isAuthInitialized, supabase]);

  return { profile, isInitialized };
} 