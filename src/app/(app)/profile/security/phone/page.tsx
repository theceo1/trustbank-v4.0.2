"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function PhoneVerificationPage() {
  const [phone, setPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const updatePhone = async (phoneNumber: string) => {
    try {
      setIsUpdating(true);
      console.log('[Phone Verification] Starting phone update...');
      
      // Format phone number to standard format
      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        // If number starts with 0, replace with +234
        if (phoneNumber.startsWith('0')) {
          formattedPhone = '+234' + phoneNumber.slice(1);
        } else {
          // If number doesn't start with 0, just add +234
          formattedPhone = '+234' + phoneNumber;
        }
      }
      console.log('[Phone Verification] Formatted phone number:', formattedPhone);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get current verification history
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('verification_history')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      console.log('[Phone Verification] Current verification history:', profile?.verification_history);

      // Update verification history with phone status
      const verificationHistory = {
        ...(profile?.verification_history || {}),
        phone: true,
        basic_info: true // Ensure basic info is marked as verified
      };

      console.log('[Phone Verification] Updated verification history:', verificationHistory);

      // Update phone number and verification history in a single transaction
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          phone_number: formattedPhone,
          verification_history: verificationHistory,
          updated_at: new Date().toISOString(),
          phone_verified: true,
          kyc_basic_verified: true, // Mark basic KYC as verified
          kyc_level: 'basic' // Update KYC level to basic
        })
        .eq('user_id', user.id);

      // Update user metadata to include phone verification
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { phone_verified: true }
      });

      if (metadataError) throw metadataError;

      if (updateError) throw updateError;

      console.log('[Phone Verification] Successfully updated profile');

      toast({
        title: "Success",
        description: "Phone number updated successfully!",
        className: "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
      });

      // Redirect to KYC page
      router.push('/kyc');
    } catch (error) {
      console.error('[Phone Verification] Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update phone number",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Phone Number Update</CardTitle>
          <CardDescription>
            Enter your phone number to continue with verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number (e.g., 08012345678)"
              disabled={isUpdating}
            />
            <p className="text-sm text-muted-foreground">
              Format: 08012345678 or 8012345678
            </p>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => updatePhone(phone)}
            disabled={isUpdating || !phone}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Phone Number
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}