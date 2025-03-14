'use client';

import { Session } from '@supabase/auth-helpers-nextjs';
import SecuritySettings from '@/components/profile/SecuritySettings';

interface ClientSecurityPageProps {
  session: Session;
  profile: any;
  twoFactorData: any;
  activeSessions: any[];
}

export default function ClientSecurityPage({
  session,
  profile,
  twoFactorData,
  activeSessions,
}: ClientSecurityPageProps) {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <SecuritySettings
        is2FAEnabled={!!twoFactorData?.enabled}
        hasAuthenticator={!!twoFactorData?.authenticator_configured}
        activeSessions={activeSessions}
      />
    </div>
  );
} 