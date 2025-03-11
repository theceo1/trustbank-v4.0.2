import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { P2POrderBook } from './P2POrderBook';
import { P2POrderForm } from './P2POrderForm';
import { P2PMyOrders } from '@/components/trades/p2p/P2PMyOrders';
import { P2PMyTrades } from './P2PMyTrades';

const SUPPORTED_CURRENCIES = [
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
];

export function P2PTrading() {
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');

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
                  onSelect={(order) => {
                    toast.info('Order Selected', {
                      description: `Selected order at ${order.price} ${order.currency}`,
                    });
                  }}
                />
              </div>
              <div className="md:col-span-4">
                <P2POrderForm type="buy" currency={selectedCurrency} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sell">
            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <P2POrderBook 
                  currency={selectedCurrency} 
                  type="buy" 
                  onSelect={(order) => {
                    toast.info('Order Selected', {
                      description: `Selected order at ${order.price} ${order.currency}`,
                    });
                  }}
                />
              </div>
              <div className="md:col-span-4">
                <P2POrderForm type="sell" currency={selectedCurrency} />
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