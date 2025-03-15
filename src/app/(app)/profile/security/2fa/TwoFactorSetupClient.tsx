'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';

interface TwoFactorSetupClientProps {
  session: any;
  profile: any;
}

export default function TwoFactorSetupClient({ session, profile }: TwoFactorSetupClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const setupTwoFactor = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to set up two-factor authentication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: 'totp',
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: 'totp',
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled.",
      });

      // Redirect to security settings
      window.location.href = '/profile/security';
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to verify the code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Two-Factor Authentication Setup
          </CardTitle>
          <CardDescription>
            Enhance your account security by enabling two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!qrCode ? (
            <Button
              onClick={setupTwoFactor}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-500"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set Up Two-Factor Authentication
            </Button>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  1. Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy)
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={qrCode} size={200} />
                </div>
                <p className="text-sm text-muted-foreground">
                  If you can't scan the QR code, enter this code manually: <code className="bg-muted p-1 rounded">{secret}</code>
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  2. Enter the verification code from your authenticator app
                </p>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
                <Button
                  onClick={verifyTwoFactor}
                  disabled={isLoading || !verificationCode}
                  className="w-full bg-green-600 hover:bg-green-500"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify and Enable
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 