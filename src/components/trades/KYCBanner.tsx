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

        // Update cookie to match database state
        if (isVerified) {
          document.cookie = 'x-kyc-status=verified; path=/; max-age=3600; SameSite=Lax';
        } else {
          // Clear the cookie if not verified
          document.cookie = 'x-kyc-status=unverified; path=/; max-age=0; SameSite=Lax';
        }
      } catch (error) {
        console.error('[KYC Banner] Error checking KYC status:', error);
        setHasBasicKyc(false);
      }
    };

    checkKyc();
  }, []);

  if (hasBasicKyc) return null;

  return (
    <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
      <AlertTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-yellow-500" />
        Complete KYC to Start Trading
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          To ensure the security of our platform and comply with regulations, you need to complete basic KYC verification before trading.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/kyc" className="inline-flex items-center">
            Complete Verification
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
} 