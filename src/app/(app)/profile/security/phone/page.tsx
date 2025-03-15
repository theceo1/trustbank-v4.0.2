"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone } from 'lucide-react';
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

const phoneFormSchema = z.object({
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits")
    .regex(/^\+?[1-9]\d{9,14}$/, "Please enter a valid phone number"),
});

type PhoneFormValues = z.infer<typeof phoneFormSchema>;

const verificationFormSchema = z.object({
  code: z.string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

export default function PhoneVerificationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
  });

  const verificationForm = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
  });

  const onPhoneSubmit = async (values: PhoneFormValues) => {
    setIsLoading(true);
    try {
      const supabase = createClientComponentClient();
      
      // Send verification SMS
      const { error } = await supabase.auth.updateUser({
        phone: values.phone
      });

      if (error) throw error;

      setVerificationSent(true);
      toast({
        title: "Verification Code Sent",
        description: "Please check your phone for the verification code.",
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerificationSubmit = async (values: VerificationFormValues) => {
    setIsLoading(true);
    try {
      const supabase = createClientComponentClient();
      
      // Verify the phone number
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneForm.getValues().phone,
        token: values.code,
        type: 'sms'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Phone number verified successfully.",
      });
      
      router.push('/profile/security');
    } catch (error) {
      console.error('Error verifying phone:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify phone number. Please try again.",
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
            <Phone className="h-5 w-5" />
            Phone Number Verification
          </CardTitle>
          <CardDescription>
            Add and verify your phone number for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!verificationSent ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1234567890" 
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
                  Send Verification Code
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...verificationForm}>
              <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="space-y-4">
                <FormField
                  control={verificationForm.control}
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
                  Verify Phone Number
                </Button>
              </form>
            </Form>
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