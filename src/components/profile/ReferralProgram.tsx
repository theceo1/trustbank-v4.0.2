'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Users, Copy, Share2, DollarSign, UserPlus, Clock } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralCode: string;
}

interface ReferralProgramProps {
  stats: ReferralStats;
}

export function ReferralProgram({ stats }: ReferralProgramProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setIsCopied(true);
      toast.success('Referral code copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy referral code');
    }
  };

  const shareReferralCode = async () => {
    if (!navigator.share) {
      toast.error('Share functionality is not supported on your device');
      return;
    }

    try {
      await navigator.share({
        title: 'Join trustBank',
        text: `Use my referral code ${stats.referralCode} to join trustBank and get trading fee discounts!`,
        url: `https://trustbank.tech/register?ref=${stats.referralCode}`,
      });
      toast.success('Referral code shared successfully');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Failed to share referral code');
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Referral Program</CardTitle>
              <CardDescription>
                Invite friends and earn rewards together
              </CardDescription>
            </div>
            <Users className="h-6 w-6 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-4">
              <label className="text-sm font-medium">Your Referral Code</label>
              <div className="flex space-x-2">
                <Input
                  value={stats.referralCode}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  title="Copy referral code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={shareReferralCode}
                  title="Share referral code"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Referrals
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.totalReferrals}
                      </p>
                    </div>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Active Referrals
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.activeReferrals}
                      </p>
                    </div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Earnings
                      </p>
                      <p className="text-2xl font-bold">
                        ${stats.totalEarnings.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Pending Earnings
                      </p>
                      <p className="text-2xl font-bold">
                        ${stats.pendingEarnings.toLocaleString()}
                      </p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium">Commission Tiers</h4>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>3+ Active Referrals</span>
                  <span className="font-medium">10% Commission</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>10+ Active Referrals</span>
                  <span className="font-medium">15% Commission</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>25+ Active Referrals</span>
                  <span className="font-medium">20% Commission</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 