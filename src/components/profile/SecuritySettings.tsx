'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Smartphone, Key, LogOut, AlertTriangle, Mail, LockKeyhole } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface SecuritySettingsProps {
  is2FAEnabled: boolean;
  hasAuthenticator: boolean;
  activeSessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
  }>;
}

export default function SecuritySettings({
  is2FAEnabled,
  hasAuthenticator,
  activeSessions,
}: SecuritySettingsProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(is2FAEnabled);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [withdrawalConfirmation, setWithdrawalConfirmation] = useState(true);

  return (
    <div className="space-y-6">
      <Card className="border-green-600/20 bg-green-50/50 dark:bg-green-900/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            <CardTitle className="text-2xl font-bold text-green-600">Security Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/profile/security/password" className="block">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="hover:border-green-600/20 transition-colors duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Key className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Password</h3>
                        <p className="text-sm text-muted-foreground">Change your account password</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            <Link href="/profile/security/2fa" className="block">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="hover:border-green-600/20 transition-colors duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <LockKeyhole className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            <Link href="/profile/security/phone" className="block">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="hover:border-green-600/20 transition-colors duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Smartphone className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Phone Number</h3>
                        <p className="text-sm text-muted-foreground">Manage your phone verification</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            <Link href="/profile/security/email" className="block">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="hover:border-green-600/20 transition-colors duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Mail className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Email Settings</h3>
                        <p className="text-sm text-muted-foreground">Update your email preferences</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Security Preferences</CardTitle>
              <CardDescription>
                Manage your security notification preferences
              </CardDescription>
            </div>
            <Key className="h-6 w-6 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="login-notifications"
                checked={loginNotifications}
                onCheckedChange={setLoginNotifications}
              />
              <Label htmlFor="login-notifications">
                Email notifications for new device logins
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="withdrawal-confirmation"
                checked={withdrawalConfirmation}
                onCheckedChange={setWithdrawalConfirmation}
              />
              <Label htmlFor="withdrawal-confirmation">
                Require email confirmation for withdrawals
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active sessions across devices
              </CardDescription>
            </div>
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{session.device}</span>
                    {session.isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.location} • Last active {session.lastActive}
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button variant="destructive" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    End Session
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </div>
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium text-destructive dark:text-destructive">Delete Account</h4>
                  <p className="text-sm text-destructive/80 dark:text-destructive/80">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 