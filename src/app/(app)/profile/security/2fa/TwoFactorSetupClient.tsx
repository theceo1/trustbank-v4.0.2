'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from 'next/navigation';

const verificationFormSchema = z.object({
  code: z.string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

interface TwoFactorSetupClientProps {
  session: any;
  profile: any;
}

export default function TwoFactorSetupClient({ session, profile }: TwoFactorSetupClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
  });

  const setupTwoFactor = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;
      if (!data || !data.totp) throw new Error('Failed to generate 2FA secret');

      setQrCodeUrl(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
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

  const onSubmit = async (values: VerificationFormValues) => {
    if (!factorId) {
      toast({
        title: "Error",
        description: "Please generate a new 2FA secret first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: values.code
      });

      if (verifyError) throw verifyError;

      // Update profile to mark 2FA as enabled
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          two_factor_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled successfully.",
      });
      
      router.push('/profile/security');
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify 2FA code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-green-600" />
          Two-Factor Authentication Setup
        </CardTitle>
        <CardDescription>
          Enhance your account security by setting up two-factor authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {qrCodeUrl ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-muted/50 rounded-lg">
              <ShieldCheck className="h-12 w-12 text-green-600" />
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Scan QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Use an authenticator app like Google Authenticator or Authy to scan this QR code
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG value={qrCodeUrl} size={200} />
              </div>
            </div>
          
            <div className="space-y-2">
              <p className="text-sm font-medium">Manual Setup</p>
              <p className="text-xs text-muted-foreground break-all bg-muted p-3 rounded-lg">
                {secret}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter 6-digit code" 
                          maxLength={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify and Enable 2FA
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="w-full"
                  >
                    Go Back
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          <Button
            onClick={setupTwoFactor}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-500 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set Up Two-Factor Authentication
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 