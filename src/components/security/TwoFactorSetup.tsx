'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QRCodeSVG } from 'qrcode.react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  userId: string;
  onComplete: () => void;
}

export function TwoFactorSetup({ userId, onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'generate' | 'verify' | 'backup'>('generate');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClientComponentClient();

  const generateSecret = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setSecret(data.secret);
      setQrCode(data.qrCode);
      setStep('verify');
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to generate 2FA secret',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode,
          secret,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Update security settings
      const { error } = await supabase
        .from('security_settings')
        .update({
          two_factor_enabled: true,
          two_factor_secret: secret,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      setBackupCodes(data.backupCodes);
      setStep('backup');
      toast.success('2FA Enabled', {
        description: 'Two-factor authentication has been enabled successfully.',
      });
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to verify code',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const finishSetup = () => {
    onComplete();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Up Two-Factor Authentication</CardTitle>
        <CardDescription>
          Protect your account with an additional layer of security
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'generate' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an extra layer of security to your account.
              Once enabled, you'll need to enter a code from your authenticator app
              when performing sensitive operations.
            </p>
            <Button
              onClick={generateSecret}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Generating...' : 'Begin Setup'}
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <QRCodeSVG value={qrCode} size={200} />
              <p className="text-sm font-mono bg-muted p-2 rounded">{secret}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Install an authenticator app like Google Authenticator
              </p>
              <p className="text-sm text-muted-foreground">
                2. Scan the QR code or enter the secret key manually
              </p>
              <p className="text-sm text-muted-foreground">
                3. Enter the verification code from your authenticator app
              </p>
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <Button
                onClick={verifyCode}
                disabled={isLoading || !verificationCode}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Save these backup codes in a secure location. You'll need them if you
                lose access to your authenticator app.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="font-mono text-sm bg-muted p-2 rounded text-center"
                >
                  {code}
                </div>
              ))}
            </div>
            <Button
              onClick={finishSetup}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              I've Saved My Backup Codes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 