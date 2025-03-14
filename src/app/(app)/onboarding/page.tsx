'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingProfile) {
          router.push('/trade');
          return;
        }

        // Create new profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: user.id,
            full_name: [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') || null,
            email: user.email,
            kyc_status: 'pending',
            kyc_level: 'basic',
            kyc_verified: false,
            is_test: false,
            daily_limit: 0,
            monthly_limit: 0,
            role: 'user',
            security_level: 'BASIC',
            two_factor_enabled: false,
            completed_trades: 0,
            completion_rate: 0,
            is_verified: false,
            quidax_id: 'TEST_' + user.id.substring(0, 8)
          }]);

        if (profileError) {
          throw profileError;
        }

        // Create default wallets
        const { error: walletsError } = await supabase
          .from('wallets')
          .insert([
            { user_id: user.id, currency: 'NGN', balance: '0' },
            { user_id: user.id, currency: 'BTC', balance: '0' },
            { user_id: user.id, currency: 'ETH', balance: '0' },
            { user_id: user.id, currency: 'USDT', balance: '0' },
            { user_id: user.id, currency: 'USDC', balance: '0' }
          ]);

        if (walletsError) {
          throw walletsError;
        }

        // Redirect to trade page
        router.push('/trade');
      } catch (err: any) {
        console.error('Error initializing profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      initializeProfile();
    }
  }, [user, authLoading, router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Failed to set up your account. Please try again or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
} 