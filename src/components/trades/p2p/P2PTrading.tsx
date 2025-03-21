import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { P2POrderBook } from './P2POrderBook';
import { P2POrderForm } from './P2POrderForm';
import { P2PMyOrders } from './P2PMyOrders';
import { P2PMyTrades } from './P2PMyTrades';
import { useAuth } from '@/app/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const SUPPORTED_CURRENCIES = [
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'SOL', label: 'Solana (SOL)' },
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
];

export function P2PTrading() {
  const { user, profile } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);

  const handleOrderSelect = async (order: any) => {
    try {
      if (!user || !profile?.quidax_id) {
        toast.error('Authentication Required', {
          description: 'Please log in to trade.',
        });
        return;
      }

      if (!profile.kyc_verified) {
        toast.error('KYC Required', {
          description: 'Please complete your KYC verification to trade.',
        });
        return;
      }

      setLoading(true);

      // Create trade
      const response = await fetch('/api/trades/p2p/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          amount: order.amount,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Trade Created', {
          description: 'Your trade has been created successfully. Please proceed with payment.',
        });

        // Show payment instructions modal or redirect to payment page
        // TODO: Implement payment flow
      } else {
        throw new Error(data.error || 'Failed to create trade');
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="p-6">
        <Alert>
          <Icons.info className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to access P2P trading features.
            <Button asChild variant="link" className="px-0">
              <Link href="/auth/login?redirect=/trades/p2p">
                Log in now →
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!profile?.kyc_verified) {
    return (
      <Card className="p-6">
        <Alert variant="warning">
          <Icons.warning className="h-4 w-4" />
          <AlertTitle>KYC Verification Required</AlertTitle>
          <AlertDescription>
            Please complete your KYC verification to start trading.
            <Button asChild variant="link" className="px-0">
              <Link href="/settings/kyc">
                Complete verification →
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="p-6">
        <Tabs defaultValue="buy" onValueChange={(v) => setOrderType(v as 'buy' | 'sell')}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="buy">Buy Crypto</TabsTrigger>
              <TabsTrigger value="sell">Sell Crypto</TabsTrigger>
            </TabsList>
            
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="border rounded-md px-3 py-2 bg-background"
              disabled={loading}
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>

          <TabsContent value="buy">
            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <P2POrderBook 
                  currency={selectedCurrency} 
                  type="sell" 
                  onSelect={handleOrderSelect}
                  loading={loading}
                />
              </div>
              <div className="md:col-span-4">
                <P2POrderForm 
                  type="buy" 
                  currency={selectedCurrency}
                  disabled={loading}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sell">
            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <P2POrderBook 
                  currency={selectedCurrency} 
                  type="buy" 
                  onSelect={handleOrderSelect}
                  loading={loading}
                />
              </div>
              <div className="md:col-span-4">
                <P2POrderForm 
                  type="sell" 
                  currency={selectedCurrency}
                  disabled={loading}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">My Orders</h3>
          <P2PMyOrders />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">My Trades</h3>
          <P2PMyTrades />
        </Card>
      </div>
    </div>
  );
} 