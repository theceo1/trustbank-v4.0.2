"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import type { Database } from '@/types/database';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PhoneVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        if (currentUser?.phone) {
          setPhone(currentUser.phone);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        toast({
          title: "Error",
          description: "Failed to get user information. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase.auth, toast]);

  const handleUpdatePhone = async () => {
    if (!user || !phone) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase.auth.updateUser({ phone });
      
      if (error) throw error;

      toast({
        title: "Verification Code Sent",
        description: "Please check your phone for the verification code.",
      });

      router.push('/profile/security');
    } catch (error) {
      console.error('Error updating phone:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update phone number",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Update Phone Number</CardTitle>
          <CardDescription>
            Enter your phone number. You'll need to verify it with a code sent via SMS.
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
              placeholder="Enter your phone number"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleUpdatePhone}
            disabled={isUpdating || !phone || phone === user.phone}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Phone
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 