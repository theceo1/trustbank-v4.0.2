"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
import { QRCodeSVG } from 'qrcode.react';

const verificationFormSchema = z.object({
  code: z.string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

export default function TwoFactorSetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
  });

  useEffect(() => {
    const generateSecret = async () => {
      try {
        const supabase = createClientComponentClient();
        
        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        console.log('Profile data:', profile);

        // For now, generate a temporary secret
        const tempSecret = 'ABCDEFGHIJKLMNOP';
        const tempQRCode = `otpauth://totp/TrustBank:${user?.email}?secret=${tempSecret}&issuer=TrustBank`;
        
        setSecret(tempSecret);
        setQRCodeData(tempQRCode);
      } catch (error) {
        console.error('Error generating 2FA secret:', error);
        toast({
          title: "Error",
          description: "Failed to generate 2FA secret. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (user) {
      generateSecret();
    }
  }, [user, toast]);

  const onSubmit = async (values: VerificationFormValues) => {
    setIsLoading(true);
    try {
      const supabase = createClientComponentClient();
      
      // Verify the code matches before enabling 2FA
      // You should use a proper TOTP verification library here
      // This is just a basic example
      if (values.code !== '123456') { // Replace with actual verification
        throw new Error('Invalid verification code');
      }
      
      // Update profile to enable 2FA
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          two_factor_enabled: true,
          two_factor_secret: secret,
          backup_codes: [], // Initialize empty backup codes
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Two-factor authentication enabled successfully.",
      });
      
      router.push('/profile/security/assessment');
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
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Two-Factor Authentication Setup
          </CardTitle>
          <CardDescription>
            Enhance your account security by setting up two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {qrCodeData && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <QRCodeSVG value={qrCodeData} size={200} />
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code with your authenticator app
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Manual Setup</p>
                <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
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
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-300 hover:text-black"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify and Enable 2FA
                  </Button>
                </form>
              </Form>
            </div>
          )}

          <div className="pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 