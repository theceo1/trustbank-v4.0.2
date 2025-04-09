'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Mail, 
  Phone, 
  Lock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Key
} from 'lucide-react';
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
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-100 dark:border-green-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-green-600" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Your account security status and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-green-100 dark:border-green-900">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Email Verified</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-yellow-100 dark:border-yellow-900">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">2FA Not Enabled</p>
                <p className="text-xs text-muted-foreground">Enable for extra security</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-green-100 dark:border-green-900">
              <Key className="w-5 h-5 text-green-600" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Strong Password</p>
                <p className="text-xs text-muted-foreground">Last changed recently</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Security */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              Email Security
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
              Verified
            </Badge>
          </div>
          <CardDescription>
            Update your email address and manage email preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                Primary email address
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleUpdateSecurity('email')}
              disabled={isUpdating}
              className="hover:bg-green-50 hover:text-green-700"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phone Security */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              Phone Security
            </CardTitle>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
              Not Verified
            </Badge>
          </div>
          <CardDescription>
            Add a phone number to enable two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{user.phone || "No phone number added"}</p>
              <p className="text-xs text-muted-foreground">
                Add a phone number for enhanced security
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleUpdateSecurity('phone')}
              disabled={isUpdating}
              className="hover:bg-green-50 hover:text-green-700"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Phone"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Security */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              Password & Authentication
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
              Strong
            </Badge>
          </div>
          <CardDescription>
            Change your password or enable two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground">
                Last changed {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : "never"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleUpdateSecurity('password')}
              disabled={isUpdating}
              className="hover:bg-green-50 hover:text-green-700"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleUpdateSecurity('2fa')}
              disabled={isUpdating}
              className="hover:bg-green-50 hover:text-green-700"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable 2FA"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active sessions and devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900">
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Session</p>
                <p className="text-xs text-muted-foreground">
                  Chrome on MacOS • Lagos, Nigeria
                </p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Active Now
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 