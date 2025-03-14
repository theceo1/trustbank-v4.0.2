'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProfile } from '@/app/hooks/useProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { P2POrderBook } from '@/components/trades/p2p/P2POrderBook';
import { P2POrderForm } from '@/components/trades/p2p/P2POrderForm';
import { AdvancedOrderForm } from '@/components/trades/p2p/AdvancedOrderForm';
import { P2PAnalytics } from '@/components/trades/p2p/P2PAnalytics';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Trade {
  id: string;
  amount: string;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
}

interface Order {
  id: string;
  type: 'buy' | 'sell';
  currency: string;
  amount: string;
  price: string;
  createdAt: string;
}

export default function P2PPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'buy' | 'sell'>('buy');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('BTC');
  const [orderFormType, setOrderFormType] = useState<'basic' | 'advanced'>('basic');
  const [loading, setLoading] = useState(true);
  
  // Fetch trades and orders data
  const trades: Trade[] = []; // Replace with actual data fetching
  const orders: Order[] = []; // Replace with actual data fetching

  useEffect(() => {
    console.log('Auth state:', { user, authLoading, profile, profileLoading });

    // Only show loading state while auth and profile are loading
    if (authLoading || profileLoading) {
      setLoading(true);
      return;
    }

    // Check authentication and KYC status
    if (!user) {
      router.push('/auth/login?redirect=/trades/p2p');
      return;
    }

    setLoading(false);

    // Show KYC verification alert if needed
    if (!profile?.kyc_verified) {
      return;
    }
  }, [user, authLoading, profile, profileLoading, router]);

  const handleAdvancedOrderSubmit = async (data: any) => {
    // Handle advanced order submission
    console.log('Advanced order:', data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive" className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>Please log in to access the trading features.</AlertDescription>
      </Alert>
    );
  }

  if (!profile?.kyc_verified) {
    return (
      <Alert variant="default" className="mb-4 border-yellow-600/20 bg-yellow-50 dark:bg-yellow-900/10">
        <Info className="h-4 w-4" />
        <AlertTitle>KYC Verification Required</AlertTitle>
        <AlertDescription>
          Please complete your KYC verification to start trading.
          <Button variant="link" asChild className="p-0 h-auto font-normal">
            <Link href="/settings/kyc">Complete KYC</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">P2P Trading</h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Buy and sell cryptocurrencies directly with other users.</p>
          <Link
            href="/trades/p2p/docs"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            View Documentation →
          </Link>
        </div>
      </div>

      <Tabs defaultValue="trade" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="trade" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <P2POrderBook
                type={selectedType}
                currency={selectedCurrency}
                onSelect={(order) => {
                  // Handle order selection
                }}
              />
            </Card>
            <div className="space-y-6">
              <Card className="p-6">
                <Tabs value={orderFormType} onValueChange={(value) => setOrderFormType(value as 'basic' | 'advanced')}>
                  <TabsList className="w-full">
                    <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
                    <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic">
                    <P2POrderForm
                      type={selectedType}
                      currency={selectedCurrency}
                    />
                  </TabsContent>
                  <TabsContent value="advanced">
                    <AdvancedOrderForm
                      type={selectedType}
                      currency={selectedCurrency}
                      onSubmit={handleAdvancedOrderSubmit}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <P2PAnalytics trades={trades} orders={orders} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 