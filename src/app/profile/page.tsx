'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProfile } from '@/app/hooks/useProfile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ProfileInformation from '@/components/profile/ProfileInformation';
import SecuritySettings from '@/components/profile/SecuritySettings';
import { ReferralProgram } from '@/components/profile/ReferralProgram';

type VerificationStatus = 'unverified' | 'pending' | 'verified';

interface UserData {
  name: string;
  email: string;
  phone: string;
  country: string;
  verificationStatus: VerificationStatus;
  joinedDate: string;
  timezone: string;
  language: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('personal');
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    phone: '',
    country: '',
    verificationStatus: 'unverified',
    joinedDate: '',
    timezone: '',
    language: '',
  });

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.user_metadata?.country || 'Nigeria',
        verificationStatus: profile?.kyc_verified ? 'verified' : 'unverified',
        joinedDate: new Date(user.created_at).toLocaleDateString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'English',
      });
    }
  }, [user, profile]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Please <Link href="/login" className="underline">log in</Link> to access your profile.
        </AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Profile not found. Please contact support if this issue persists.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="referral">Referral Program</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <Card className="mt-6">
            <ProfileInformation user={userData} />
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card className="mt-6">
            <SecuritySettings
              is2FAEnabled={false}
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
          </Card>
        </TabsContent>
        <TabsContent value="referral">
          <Card className="mt-6">
            <ReferralProgram
              stats={{
                totalReferrals: 0,
                activeReferrals: 0,
                totalEarnings: 0,
                pendingEarnings: 0,
                referralCode: user.id.slice(0, 8).toUpperCase(),
              }}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 