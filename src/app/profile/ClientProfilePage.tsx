'use client';

import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileInformation from '@/components/profile/ProfileInformation';
import SecuritySettings from '@/components/profile/SecuritySettings';
import { ReferralProgram } from '@/components/profile/ReferralProgram';

interface UserData {
  name: string;
  email: string;
  phone: string;
  country: string;
  avatar?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  joinedDate: string;
  timezone: string;
  language: string;
}

interface ClientProfilePageProps {
  initialSession: Session;
  initialProfile: any; // Replace with proper type
}

export default function ClientProfilePage({
  initialSession,
  initialProfile,
}: ClientProfilePageProps) {
  const [activeTab, setActiveTab] = useState('personal');

  const userData: UserData = {
    name: `${initialSession.user.user_metadata?.first_name || ''} ${initialSession.user.user_metadata?.last_name || ''}`.trim(),
    email: initialSession.user.email || '',
    phone: initialSession.user.phone || '',
    country: initialSession.user.user_metadata?.country || 'Nigeria',
    verificationStatus: initialProfile.kyc_verified ? 'verified' : 'unverified',
    joinedDate: new Date(initialSession.user.created_at).toLocaleDateString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'English',
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="referral">Referral Program</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <ProfileInformation userData={userData} />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings 
            is2FAEnabled={initialProfile.two_factor_enabled}
            hasAuthenticator={false}
            activeSessions={[
              {
                id: '1',
                device: 'Chrome on MacOS',
                location: 'Lagos, Nigeria',
                lastActive: 'Just now',
                isCurrent: true,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="referral">
          <ReferralProgram
            stats={{
              totalReferrals: initialProfile.total_referrals || 0,
              activeReferrals: initialProfile.active_referrals || 0,
              totalEarnings: initialProfile.referral_earnings || 0,
              pendingEarnings: initialProfile.pending_earnings || 0,
              referralCode: initialProfile.referral_code || initialSession.user.id.slice(0, 8).toUpperCase(),
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 