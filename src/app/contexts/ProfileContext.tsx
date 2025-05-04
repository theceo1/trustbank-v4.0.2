'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

interface Profile {
  id: string;
  user_id: string;
  kyc_basic_verified: boolean;
  verification_history: {
    email?: boolean;
    phone?: boolean;
    basic_info?: boolean;
    bvn?: boolean;
    nin?: boolean;
    selfie?: boolean;
    passport?: boolean;
    livecheck?: boolean;
    government_id?: boolean;
  };
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient<Database>();

  const fetchProfile = async (userId?: string) => {
    try {
      if (!userId) {
        setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Check if the user has completed basic KYC
      // A user is considered KYC verified if they have completed basic info
      // AND have at least one form of ID verification (bvn, nin, passport, or government_id)
      const hasBasicKyc = data?.verification_history?.basic_info === true;
      const hasIdVerification = 
        data?.verification_history?.bvn === true ||
        data?.verification_history?.nin === true ||
        data?.verification_history?.passport === true ||
        data?.verification_history?.government_id === true;
      
      // Set kyc_basic_verified based on verification history
      const profileWithKycStatus = {
        ...data,
        kyc_basic_verified: hasBasicKyc && hasIdVerification
      };

      setProfile(profileWithKycStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    await fetchProfile(session?.user?.id);
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }
  return context;
}; 