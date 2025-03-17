import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

export function KYCBanner() {
  const [hasBasicKyc, setHasBasicKyc] = useState(true); // Default to true to prevent flash

  useEffect(() => {
    const checkKyc = async () => {
      try {
        const cookies = document.cookie.split(';');
        const kycCookie = cookies.find(c => c.trim().startsWith('x-kyc-status='));
        const kycStatus = kycCookie ? kycCookie.split('=')[1] === 'verified' : false;
        setHasBasicKyc(kycStatus);
      } catch (error) {
        console.error('Error checking KYC status:', error);
        // Default to false if there's an error checking KYC status
        // This ensures users can't bypass KYC by causing errors
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