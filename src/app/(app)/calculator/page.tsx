'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Calculator as CalculatorIcon, RefreshCw } from 'lucide-react';
import { quidaxService } from '@/lib/quidax';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

interface MarketTicker {
  ticker: {
    buy: string;
    sell: string;
    low: string;
    high: string;
    open: string;
    last: string;
    vol: string;
  };
}

interface CompetitorRate {
  name: string;
  rate: number;
}

interface ErrorResponse {
  message: string;
  code?: number;
}

const formatNumber = (value: number, currency: string) => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: currency === 'NGN' ? 'currency' : 'decimal',
    currency: 'NGN',
    minimumFractionDigits: currency === 'BTC' ? 8 : 2,
    maximumFractionDigits: currency === 'BTC' ? 8 : 2,
  });
  return formatter.format(value).replace('NGN', '₦');
};

export default function CalculatorPage() {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('BTC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorRate[]>([]);
  const [quidaxId, setQuidaxId] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  const currencies = [
    { value: 'NGN', label: 'Nigerian Naira (NGN)' },
    { value: 'USDT', label: 'Tether (USDT)' },
    { value: 'BTC', label: 'Bitcoin (BTC)' },
    { value: 'ETH', label: 'Ethereum (ETH)' },
    { value: 'BNB', label: 'Binance Coin (BNB)' },
    { value: 'SOL', label: 'Solana (SOL)' },
    { value: 'MATIC', label: 'Polygon (MATIC)' },
    { value: 'DOGE', label: 'Dogecoin (DOGE)' },
    { value: 'SHIB', label: 'Shiba Inu (SHIB)' },
    { value: 'XRP', label: 'Ripple (XRP)' },
    { value: 'ADA', label: 'Cardano (ADA)' },
    { value: 'DOT', label: 'Polkadot (DOT)' },
    { value: 'LINK', label: 'Chainlink (LINK)' },
    { value: 'AAVE', label: 'Aave (AAVE)' },
    { value: 'CAKE', label: 'PancakeSwap (CAKE)' },
    { value: 'FTM', label: 'Fantom (FTM)' },
    { value: 'AVAX', label: 'Avalanche (AVAX)' },
    { value: 'ATOM', label: 'Cosmos (ATOM)' },
    { value: 'NEAR', label: 'NEAR Protocol (NEAR)' }
  ];

  useEffect(() => {
    fetchQuidaxId();
  }, []);

  useEffect(() => {
    if (amount && currency) {
      calculateRate();
    }
  }, [amount, currency]);

  async function fetchQuidaxId() {
    try {
      const response = await fetch('/api/user/quidax-id');
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setQuidaxId(data.quidaxId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  }

  const fetchMarketTickers = async () => {
    try {
      const response = await fetch('/api/markets/tickers');
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
      return null;
    }
  };

  const calculateRate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/markets/calculate-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          quidaxId,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setRate(data.rate);
      setCompetitors(data.competitors || []);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      <div className="container mx-auto px-4 py-12 mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
              Crypto Calculator
            </h1>
            <p className="text-muted-foreground mt-2">
              Get real-time conversion rates for cryptocurrencies and fiat currencies
            </p>
          </div>

          <div className="text-left mb-2 flex items-center gap-2">
            <h2 className="text-lg font-semibold">trust<span className="text-green-600">Rate™</span></h2>
            <span className="px-2.5 py-0.5 text-[6px] font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full uppercase tracking-wider">
              Beta
            </span>
          </div>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-black/50">
            <CardContent className="p-6">
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg h-12"
                  />
                  <div className="absolute right-3 top-3 text-sm text-muted-foreground">
                    {currency}
                  </div>
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ArrowRight className="w-6 h-6 text-green-600" />
                  </motion.div>

                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={calculateRate}
                  disabled={loading}
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CalculatorIcon className="w-5 h-5 mr-2" />
                      Calculate Rate
                    </>
                  )}
                </Button>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {rate !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                      <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
                        {formatNumber(parseFloat(amount), currency)} {currency} = 
                      </div>
                      <div className="text-3xl font-bold text-green-600 mt-2">
                        {formatNumber(rate, currency)} {currency}
                      </div>
                      <div className="text-sm text-muted-foreground mt-3 border-t border-green-100 dark:border-green-800 pt-3">
                        1 {currency} = {formatNumber(rate / parseFloat(amount), currency)} {currency}
                      </div>
                    </div>

                    {(currency === 'NGN') && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          Market Comparison
                          <span className="text-xs text-muted-foreground">(NGN)</span>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {competitors.map((competitor, index) => (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              key={competitor.name}
                              className={`relative overflow-hidden rounded-lg ${
                                competitor.name === 'trustBank'
                                  ? 'bg-gradient-to-br from-green-600 to-green-700 text-white'
                                  : 'bg-white dark:bg-black/40'
                              } p-4 shadow-sm`}
                            >
                              <div className="font-medium">{competitor.name}</div>
                              <div className="text-lg font-semibold mt-1">
                                {formatNumber(competitor.rate, 'NGN')}
                              </div>
                              {competitor.name === 'trustBank' && (
                                <>
                                  <div className="text-xs mt-1 text-green-100">Best Rate!</div>
                                  <div className="absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8">
                                    <div className="absolute inset-0 bg-white/10 rotate-45"></div>
                                  </div>
                                </>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg"
          >
            <p className="font-medium">Note:</p>
            <p>The conversion results shown are estimates. Actual rates may vary slightly at the time of transaction due to market volatility and network conditions.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 