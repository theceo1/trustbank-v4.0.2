'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProfile } from '@/app/hooks/useProfile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import SecuritySettings from '@/components/profile/SecuritySettings';

export default function SecurityPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [hasAuthenticator, setHasAuthenticator] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    {
      id: '1',
      device: 'Chrome on MacOS',
      location: 'Lagos, Nigeria',
      lastActive: 'Just now',
      isCurrent: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'Lagos, Nigeria',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Please <Link href="/login" className="underline">log in</Link> to access security settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <SecuritySettings
        is2FAEnabled={is2FAEnabled}
        hasAuthenticator={hasAuthenticator}
        activeSessions={activeSessions}
      />
    </div>
  );
} 