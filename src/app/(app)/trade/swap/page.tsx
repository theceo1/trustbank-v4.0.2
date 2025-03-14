'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { SwapForm } from "@/components/trades/swap/SwapForm";
import { SwapHistory } from "@/components/trades/swap/SwapHistory";
import { useAuth } from '@/app/contexts/AuthContext';
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useProfile } from '@/app/hooks/useProfile';

export default function SwapClient() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please <Link href="/auth/login" className="text-green-600 hover:text-green-700 underline">log in</Link> to access swap features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile?.kyc_verified) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="default" className="border-green-600/20 bg-green-50 dark:bg-green-900/10">
          <Info className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700 dark:text-green-300">Verification Required</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            Please complete your KYC verification to start trading. <Link href="/kyc" className="underline">Click here to verify</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Swap Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <SwapForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Swap History</CardTitle>
            </CardHeader>
            <CardContent>
              <SwapHistory />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
} 