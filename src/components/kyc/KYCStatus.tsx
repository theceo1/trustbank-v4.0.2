import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import type { Database } from '@/lib/supabase';

interface KYCStatusProps {
  onStartVerification: (level: 'basic' | 'intermediate' | 'advanced') => void;
}

export function KYCStatus({ onStartVerification }: KYCStatusProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Database['public']['Tables']['user_profiles']['Row'] | null>(null);
  const [kycRecords, setKYCRecords] = useState<Database['public']['Tables']['kyc_records']['Row'][]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function loadKYCData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [profileResponse, kycResponse] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('kyc_records')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        ]);

        if (profileResponse.data) {
          setProfile(profileResponse.data);
        }
        if (kycResponse.data) {
          setKYCRecords(kycResponse.data);
        }
      } catch (error) {
        console.error('Error loading KYC data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadKYCData();
  }, [supabase]);

  const getVerificationStatus = (level: 'basic' | 'intermediate' | 'advanced') => {
    if (!profile) return 'not_started';
    if (profile.kyc_level === level) return 'verified';
    if (kycRecords.some(record => record.status === 'pending')) return 'pending';
    return 'not_started';
  };

  const renderVerificationLevel = (
    level: 'basic' | 'intermediate' | 'advanced',
    title: string,
    requirements: string[]
  ) => {
    const status = getVerificationStatus(level);
    const isCurrentLevel = profile?.kyc_level === level;
    const canStartVerification = 
      status === 'not_started' && 
      (level === 'basic' || 
       (level === 'intermediate' && profile?.kyc_level === 'basic') ||
       (level === 'advanced' && profile?.kyc_level === 'intermediate'));

    return (
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {isCurrentLevel ? 'Current Level' : 'Next Level'}
            </p>
          </div>
          {status === 'verified' && (
            <Icons.check className="h-5 w-5 text-green-500" />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Requirements:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            {requirements.map((req, index) => (
              <li key={index} className="text-muted-foreground">
                {req}
              </li>
            ))}
          </ul>
        </div>
        {canStartVerification && (
          <Button
            onClick={() => onStartVerification(level)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Start Verification
          </Button>
        )}
        {status === 'pending' && (
          <p className="text-sm text-yellow-600">
            Verification in progress...
          </p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">KYC Verification</h2>
        <p className="text-muted-foreground">
          Complete the verification process to increase your transaction limits
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {renderVerificationLevel('basic', 'Basic Verification', [
          'National Identification Number (NIN)',
          'Selfie Photo',
          'Transaction Limit: ₦50,000/day',
        ])}

        {renderVerificationLevel('intermediate', 'Intermediate Verification', [
          'Bank Verification Number (BVN)',
          'Transaction Limit: ₦1,000,000/day',
        ])}

        {renderVerificationLevel('advanced', 'Advanced Verification', [
          'International Passport or Driver\'s License',
          'Selfie Photo',
          'Transaction Limit: Unlimited',
        ])}
      </div>
    </div>
  );
} 