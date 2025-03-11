'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownUp, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SUPPORTED_CURRENCIES = [
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'USDT', label: 'Tether (USDT)' },
];

export default function TradePage() {
  const [tab, setTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('NGN');
  const [toCurrency, setToCurrency] = useState('BTC');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: Implement trade logic
      toast({
        title: 'Order placed successfully',
        description: `Your ${tab} order has been placed and will be processed shortly.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error placing order',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="buy">Buy Crypto</TabsTrigger>
                <TabsTrigger value="sell">Sell Crypto</TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">You Pay</label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={fromCurrency} onValueChange={setFromCurrency}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background"
                          onClick={handleSwapCurrencies}
                        >
                          <ArrowDownUp className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-full border-t dark:border-gray-800" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">You Receive</label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          disabled
                          className="flex-1"
                        />
                        <Select value={toCurrency} onValueChange={setToCurrency}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Exchange Rate</span>
                      <span>1 {fromCurrency} = 0.00 {toCurrency}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Network Fee</span>
                      <span>0.00 {toCurrency}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <span>Processing...</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Buy {toCurrency}
                      </span>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="sell" className="space-y-6">
                {/* Similar structure as buy tab, but with sell-specific content */}
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">You Sell</label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={fromCurrency} onValueChange={setFromCurrency}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background"
                          onClick={handleSwapCurrencies}
                        >
                          <ArrowDownUp className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-full border-t dark:border-gray-800" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">You Receive</label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          disabled
                          className="flex-1"
                        />
                        <Select value={toCurrency} onValueChange={setToCurrency}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Exchange Rate</span>
                      <span>1 {fromCurrency} = 0.00 {toCurrency}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Network Fee</span>
                      <span>0.00 {toCurrency}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <span>Processing...</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Sell {fromCurrency}
                      </span>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 