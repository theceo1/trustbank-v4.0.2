'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/contexts/AuthContext';
import { Shield, Mail, Phone, KeyRound, Smartphone, AlertTriangle, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security and authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Security */}
          <div className="flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors rounded-lg border">
            <div className="flex items-center gap-4">
              <Lock className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium">Password Security</h3>
                <p className="text-sm text-muted-foreground">Change your password and recovery options</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile/security/password">Manage</Link>
            </Button>
          </div>

          {/* Email Verification */}
          <div className="flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors rounded-lg border">
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium">Email Verification</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.email_confirmed_at ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-300">Verified</Badge>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/profile/security/email">Verify Email</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Phone Verification */}
          <div className="flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors rounded-lg border">
            <div className="flex items-center gap-4">
              <Phone className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium">Phone Verification</h3>
                <p className="text-sm text-muted-foreground">
                  {user?.phone || 'No phone number added'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.phone_confirmed_at ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-300">Verified</Badge>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/profile/security/phone">
                    {user?.phone ? 'Verify Phone' : 'Add Phone'}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors rounded-lg border">
            <div className="flex items-center gap-4">
              <KeyRound className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled
                    ? 'Enabled with authenticator app'
                    : 'Not configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {is2FAEnabled ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/profile/security/2fa">Manage 2FA</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/profile/security/2fa">Enable 2FA</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Recovery Methods */}
          <div className="flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors rounded-lg border">
            <div className="flex items-center gap-4">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium">Recovery Methods</h3>
                <p className="text-sm text-muted-foreground">
                  Set up backup codes and security questions
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile/security/recovery">Manage</Link>
            </Button>
          </div>

          {/* Active Sessions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                Active Sessions
              </h3>
            </div>
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{session.device}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.location} • {session.lastActive}
                    </p>
                  </div>
                  {session.isCurrent ? (
                    <Badge variant="secondary">Current Session</Badge>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        // Handle session termination
                      }}
                    >
                      Terminate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Security Recommendations */}
          {(!user?.email_confirmed_at || !user?.phone_confirmed_at || !is2FAEnabled) && (
            <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/50 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Security Recommendations
                </h3>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                  {!user?.email_confirmed_at && (
                    <li>Verify your email address</li>
                  )}
                  {!user?.phone_confirmed_at && (
                    <li>Add and verify your phone number</li>
                  )}
                  {!is2FAEnabled && (
                    <li>Enable two-factor authentication</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 