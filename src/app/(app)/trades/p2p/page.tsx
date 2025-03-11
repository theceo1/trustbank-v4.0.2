import { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { P2POrderBook } from '@/components/trades/p2p/P2POrderBook';
import { P2POrderForm } from '@/components/trades/p2p/P2POrderForm';
import { AdvancedOrderForm } from '@/components/trades/p2p/AdvancedOrderForm';
import { P2PAnalytics } from '@/components/trades/p2p/P2PAnalytics';
import { Card } from '@/components/ui/card';

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
  const [selectedType, setSelectedType] = useState<'buy' | 'sell'>('buy');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('BTC');
  const [orderFormType, setOrderFormType] = useState<'basic' | 'advanced'>('basic');
  
  // Fetch trades and orders data
  const trades: Trade[] = []; // Replace with actual data fetching
  const orders: Order[] = []; // Replace with actual data fetching

  const handleAdvancedOrderSubmit = async (data: any) => {
    // Handle advanced order submission
    console.log('Advanced order:', data);
  };

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