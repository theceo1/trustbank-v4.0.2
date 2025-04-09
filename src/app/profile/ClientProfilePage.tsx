'use client';

import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileInformation from '@/components/profile/ProfileInformation';
import SecuritySettings from '@/components/profile/SecuritySettings';
import { ReferralProgram } from '@/components/profile/ReferralProgram';
import { User, Shield, Users } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/50 dark:to-blue-950/50">
      <div className="container mx-auto py-4">
        <div className="mb-8">
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-2 text-sm italic">
            Manage your account settings and preferences
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid w-full grid-cols-3 gap-4 bg-muted p-1 rounded-lg">
                <TabsTrigger 
                  value="personal"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all"
                >
                  <User className="w-4 h-4 mr-2" />
                  Personal Information
                </TabsTrigger>
                <TabsTrigger 
                  value="security"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger 
                  value="referral"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Referral Program
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <ProfileInformation userData={userData} />
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
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

              <TabsContent value="referral" className="space-y-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 