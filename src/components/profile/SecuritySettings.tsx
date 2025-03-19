'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import type { Database } from '@/types/database';

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase.auth]);

  const handleUpdateSecurity = async (path: string) => {
    setIsUpdating(true);
    try {
      router.push(`/profile/security/${path}`);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to navigate to security settings. Please try again.",
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Update your email address and manage email preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-sm text-muted-foreground">
                {user.email_confirmed_at ? "Verified" : "Not verified"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleUpdateSecurity('email')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phone Number</CardTitle>
          <CardDescription>
            Add a phone number to enable two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user.phone || "No phone number added"}</p>
              <p className="text-sm text-muted-foreground">
                {user.phone_confirmed_at ? "Verified" : "Not verified"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleUpdateSecurity('phone')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password or enable two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Last changed {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : "never"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleUpdateSecurity('password')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 