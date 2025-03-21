import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function KYCBanner() {
  const [hasBasicKyc, setHasBasicKyc] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkKyc = async () => {
      try {
        setLoading(true);
        // Get session first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[KYC Banner] No session found');
          setHasBasicKyc(false);
          return;
        }

        // Always check database state
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('verification_history, kyc_verified')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('[KYC Banner] Error fetching profile:', error);
          setHasBasicKyc(false);
          return;
        }

        console.log('[KYC Banner] Profile data:', profile);

        // If kyc_verified is true, user has completed KYC
        if (profile?.kyc_verified) {
          console.log('[KYC Banner] User is KYC verified via kyc_verified flag');
          setHasBasicKyc(true);
          return;
        }

        const verificationHistory = profile?.verification_history || {};
        
        // Check if user has completed basic KYC
        const isBasicKycVerified = verificationHistory.nin || 
                                 verificationHistory.bvn ||
                                 (verificationHistory.email && 
                                  verificationHistory.phone && 
                                  verificationHistory.basic_info);

        console.log('[KYC Banner] Verification status:', {
          nin: verificationHistory.nin,
          bvn: verificationHistory.bvn,
          email: verificationHistory.email,
          phone: verificationHistory.phone,
          basic_info: verificationHistory.basic_info,
          isVerified: isBasicKycVerified
        });

        // If user is verified, update their kyc_verified flag
        if (isBasicKycVerified) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ kyc_verified: true })
            .eq('user_id', session.user.id);

          if (updateError) {
            console.error('[KYC Banner] Error updating kyc_verified flag:', updateError);
          }
        }

        setHasBasicKyc(isBasicKycVerified);
      } catch (error) {
        console.error('[KYC Banner] Error checking KYC status:', error);
        setHasBasicKyc(false);
      } finally {
        setLoading(false);
      }
    };

    checkKyc();
  }, [supabase]);

  // Don't show anything while loading
  if (loading) {
    return null;
  }

  // Don't show banner if user has completed KYC
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