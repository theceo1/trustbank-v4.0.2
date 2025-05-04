import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BankAccountVerifierProps {
  onVerified: (accountName: string) => void;
  bankCode: string;
  accountNumber: string;
}

export function BankAccountVerifier({ onVerified, bankCode, accountNumber }: BankAccountVerifierProps) {
  const [loading, setLoading] = useState(false);

  const verifyAccount = async () => {
    if (!bankCode || !accountNumber) {
      toast.error('Please provide bank code and account number');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/payments/korapay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, bankCode }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        onVerified(data.data.account_name);
        toast.success('Account verified successfully');
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify account', {
        description: error instanceof Error ? error.message : 'Please check the details and try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Account Number</Label>
        <Input value={accountNumber} disabled />
      </div>
      <div className="space-y-2">
        <Label>Bank Code</Label>
        <Input value={bankCode} disabled />
      </div>
      <Button
        onClick={verifyAccount}
        disabled={loading || !bankCode || !accountNumber}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Account'
        )}
      </Button>
    </div>
  );
} 