'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Users, Copy, Share2, DollarSign, UserPlus, Clock, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
      toast({
        title: "Success!",
        description: "Referral code copied to clipboard",
        className: "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy referral code",
        variant: "destructive",
      });
    }
  };

  const shareReferralCode = async () => {
    if (!navigator.share) {
      toast({
        title: "Error",
        description: "Share functionality is not supported on your device",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.share({
        title: 'Join trustBank',
        text: `Use my referral code ${stats.referralCode} to join trustBank and get trading fee discounts!`,
        url: `https://trustbank.tech/register?ref=${stats.referralCode}`,
      });
      toast({
        title: "Success!",
        description: "Referral code shared successfully",
        className: "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast({
          title: "Error",
          description: "Failed to share referral code",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-100 dark:border-green-900">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-green-600" />
                Referral Program
              </CardTitle>
              <CardDescription>
                Invite friends and earn rewards together
              </CardDescription>
            </div>
            <Badge variant="outline" className="self-start sm:self-center bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 whitespace-nowrap">
              Tier {stats.totalReferrals >= 25 ? '3' : stats.totalReferrals >= 10 ? '2' : '1'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-4">
              <label className="text-sm font-medium">Your Referral Code</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    value={stats.referralCode}
                    readOnly
                    className="font-mono bg-white dark:bg-gray-900 pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                      className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900/20"
                      title="Copy referral code"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={shareReferralCode}
                      className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900/20"
                      title="Share referral code"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="transition-all hover:shadow-md">
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
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <UserPlus className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="transition-all hover:shadow-md">
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
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="transition-all hover:shadow-md">
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
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="transition-all hover:shadow-md">
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
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <h4 className="font-medium mb-4">Commission Tiers</h4>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${
                    stats.totalReferrals >= 3 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">3+ Active Referrals</span>
                      {stats.totalReferrals >= 3 && (
                        <Badge variant="outline" className="bg-green-100 text-green-700">Active</Badge>
                      )}
                    </div>
                    <span className="font-medium">10% Commission</span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${
                    stats.totalReferrals >= 10 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">10+ Active Referrals</span>
                      {stats.totalReferrals >= 10 && (
                        <Badge variant="outline" className="bg-green-100 text-green-700">Active</Badge>
                      )}
                    </div>
                    <span className="font-medium">15% Commission</span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${
                    stats.totalReferrals >= 25 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">25+ Active Referrals</span>
                      {stats.totalReferrals >= 25 && (
                        <Badge variant="outline" className="bg-green-100 text-green-700">Active</Badge>
                      )}
                    </div>
                    <span className="font-medium">20% Commission</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}