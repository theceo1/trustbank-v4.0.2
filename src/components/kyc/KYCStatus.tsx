import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { Database } from '@/types/database';
import { KYCVerificationForm } from './KYCVerificationForm';

interface KYCStatusProps {
  onStartVerification: (level: 'basic' | 'intermediate' | 'advanced') => void;
}

interface Profile {
  id: string;
  user_id: string;
  tier1_verified: boolean;
  tier2_verified: boolean;
  tier3_verified: boolean;
  tier1_submitted_at: string | null;
  tier2_submitted_at: string | null;
  tier3_submitted_at: string | null;
  tier1_verified_at: string | null;
  tier2_verified_at: string | null;
  tier3_verified_at: string | null;
  tier1_reference_id: string | null;
  tier2_reference_id: string | null;
  tier3_reference_id: string | null;
  tier1_data: Record<string, unknown>;
  tier2_data: Record<string, unknown>;
  tier3_data: Record<string, unknown>;
}

type VerificationLevel = 1 | 2 | 3;
type KYCLevel = 'basic' | 'intermediate' | 'advanced';
type VerificationStatus = 'not_started' | 'pending' | 'verified';
type VerificationData = {
  selfie?: string;
  documentFront?: string;
  documentBack?: string;
  address?: string;
  [key: string]: string | undefined;
};

const mapVerificationLevel = (level: VerificationLevel): KYCLevel => {
  switch (level) {
    case 1:
      return 'basic';
    case 2:
      return 'intermediate';
    case 3:
      return 'advanced';
  }
};

export function KYCStatus() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<VerificationLevel | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const supabase = createClientComponentClient<Database>();

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(profile);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error loading profile:', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const getCurrentLevel = (): number => {
    if (!profile) return 0;
    if (profile.tier3_verified) return 3;
    if (profile.tier2_verified) return 2;
    if (profile.tier1_verified) return 1;
    return 0;
  };

  const getVerificationStatus = (level: VerificationLevel): VerificationStatus => {
    if (!profile) return 'not_started';
    
    const submittedAt = profile[`tier${level}_submitted_at` as keyof Profile] as string | null;
    const verifiedAt = profile[`tier${level}_verified_at` as keyof Profile] as string | null;
    const isVerified = profile[`tier${level}_verified` as keyof Profile] as boolean;

    if (isVerified) return 'verified';
    if (submittedAt && !verifiedAt) return 'pending';
    return 'not_started';
  };

  const handleVerificationComplete = async (level: VerificationLevel, data: VerificationData): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = {
        [`tier${level}_submitted_at`]: new Date().toISOString(),
        [`tier${level}_data`]: data,
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsCompleted(true);
      await loadProfile();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating verification:', error.message);
      }
    }
  };

  const handleStartVerification = (level: VerificationLevel) => {
    setSelectedLevel(level);
  };

  const handleCancel = () => {
    setSelectedLevel(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (selectedLevel) {
    return (
      <KYCVerificationForm
        level={mapVerificationLevel(selectedLevel)}
        onComplete={() => {
          setIsCompleted(true);
          void loadProfile();
        }}
        onCancel={handleCancel}
      />
    );
  }

  if (isCompleted) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Verification Submitted!</h2>
        <p className="mb-4">Your verification has been submitted successfully. We will review it shortly.</p>
        <Button onClick={() => window.location.href = '/dashboard'}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const currentLevel = getCurrentLevel();

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {[1, 2, 3].map((level) => {
          const status = getVerificationStatus(level as VerificationLevel);
          const isCurrentLevel = level === currentLevel + 1;
          const isPreviousVerified = level === 1 || getVerificationStatus((level - 1) as VerificationLevel) === 'verified';
          
          return (
            <div key={level} className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">
                Level {level} Verification
                {status === 'verified' && (
                  <span className="ml-2 text-green-500">✓</span>
                )}
              </h3>
              <div className="mb-4">
                {level === 1 && (
                  <p>Basic verification - Provide your personal information and a selfie</p>
                )}
                {level === 2 && (
                  <p>Intermediate verification - Submit your government-issued ID</p>
                )}
                {level === 3 && (
                  <p>Advanced verification - Proof of address and additional documentation</p>
                )}
              </div>
              <div>
                {status === 'verified' ? (
                  <span className="text-green-500">Verified</span>
                ) : status === 'pending' ? (
                  <span className="text-yellow-500">Pending Review</span>
                ) : (
                  <Button
                    onClick={() => handleStartVerification(level as VerificationLevel)}
                    disabled={!isPreviousVerified || !isCurrentLevel}
                  >
                    Start Verification
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 