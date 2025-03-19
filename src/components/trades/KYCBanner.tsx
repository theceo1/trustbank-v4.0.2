import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function KYCBanner() {
  const [hasBasicKyc, setHasBasicKyc] = useState(true); // Default to true to prevent flash
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkKyc = async () => {
      try {
        // Get session first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[KYC Banner] No session found');
          setHasBasicKyc(false);
          return;
        }

        // Always check database state
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('verification_history')
          .eq('user_id', session.user.id)
          .single();

        console.log('[KYC Banner] Profile verification history:', profile?.verification_history);

        const verificationHistory = profile?.verification_history || {};
        const isVerified = verificationHistory.email && 
                          verificationHistory.phone && 
                          verificationHistory.basic_info;

        console.log('[KYC Banner] Verification status:', {
          email: verificationHistory.email,
          phone: verificationHistory.phone,
          basic_info: verificationHistory.basic_info,
          isVerified
        });

        setHasBasicKyc(isVerified);
      } catch (error) {
        console.error('Error checking KYC status:', error);
        setHasBasicKyc(false);
      }
    };

    checkKyc();
  }, [supabase]);

  if (hasBasicKyc) {
    return null;
  }

  return (
    <Alert variant="default" className="border-yellow-600/20 bg-yellow-50 dark:bg-yellow-900/10">
      <Shield className="h-4 w-4" />
      <AlertTitle>Complete Your Profile</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Complete your profile verification to start trading.</span>
        <Button variant="link" asChild className="p-0 h-auto font-normal">
          <Link href="/kyc" className="flex items-center">
            Verify Now
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
} 