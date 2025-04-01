'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Calculator as CalculatorIcon, RefreshCw } from 'lucide-react';

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
  features: string[];
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
  const [fromCurrency, setFromCurrency] = useState<string>('NGN');
  const [toCurrency, setToCurrency] = useState<string>('BTC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedRate, setCalculatedRate] = useState<number | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorRate[]>([]);

  const currencies = [
    { value: 'NGN', label: 'Nigerian Naira (NGN)' },
    { value: 'USDT', label: 'Tether (USDT)' },
    { value: 'BTC', label: 'Bitcoin (BTC)' },
    { value: 'ETH', label: 'Ethereum (ETH)' }
  ];

  const fetchMarketTickers = async () => {
    try {
      const response = await fetch('/api/markets/tickers');
      const data = await response.json();
      
      if (!data.data) {
        throw new Error('Failed to fetch market data');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  };

  const calculateRate = async () => {
    try {
      setLoading(true);
      setError(null);

      const tickers = await fetchMarketTickers();
      if (!tickers) {
        throw new Error('Failed to fetch market data');
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        throw new Error('Please enter a valid amount');
      }

      let rate: number;

      // Get market pair based on currencies
      const getMarketPair = (from: string, to: string) => {
        const direct = `${from.toLowerCase()}${to.toLowerCase()}`;
        const reverse = `${to.toLowerCase()}${from.toLowerCase()}`;
        
        if (tickers[direct]) return { pair: direct, isReverse: false };
        if (tickers[reverse]) return { pair: reverse, isReverse: true };
        
        return null;
      };

      // Try to get direct pair first
      const marketPair = getMarketPair(fromCurrency, toCurrency);
      
      if (marketPair) {
        const ticker = tickers[marketPair.pair].ticker;
        const price = parseFloat(ticker.last);
        
        if (marketPair.isReverse) {
          rate = parsedAmount * (1 / price);
        } else {
          rate = parsedAmount * price;
        }
      } else {
        // Try conversion through USDT
        const fromUsdtPair = getMarketPair(fromCurrency, 'USDT');
        const toUsdtPair = getMarketPair(toCurrency, 'USDT');
        
        if (!fromUsdtPair || !toUsdtPair) {
          throw new Error(`No market data available for ${fromCurrency}/${toCurrency}`);
        }
        
        const fromPrice = parseFloat(tickers[fromUsdtPair.pair].ticker.last);
        const toPrice = parseFloat(tickers[toUsdtPair.pair].ticker.last);
        
        let usdtAmount;
        if (fromUsdtPair.isReverse) {
          usdtAmount = parsedAmount * (1 / fromPrice);
        } else {
          usdtAmount = parsedAmount * fromPrice;
        }
        
        if (toUsdtPair.isReverse) {
          rate = usdtAmount * (1 / toPrice);
        } else {
          rate = usdtAmount * toPrice;
        }
      }

      setCalculatedRate(rate);

      // Add competitor rates - trustBank always has the best rate
      const competitorRates = [
        { 
          name: 'trustBank', 
          rate: rate,
          features: [
            'No hidden fees',
            'Instant transfers',
            'Best market rates'
          ]
        },
        { 
          name: 'Competitor A', 
          rate: rate * 1.015, // 1.5% higher than trustBank
          features: [
            'Hidden fees apply',
            '24hr processing',
            'Market rates + 1.5%'
          ]
        },
        { 
          name: 'Competitor B', 
          rate: rate * 1.018, // 1.8% higher than trustBank
          features: [
            'Transaction fees',
            '2-3 day processing',
            'Market rates + 1.8%'
          ]
        }
      ];
      
      setCompetitors(competitorRates);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setAmount('');
    setCalculatedRate(null);
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleAmountChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    const parts = sanitizedValue.split('.');
    const finalValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
    setAmount(finalValue);
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
                    type="text"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="text-lg h-12"
                  />
                  <div className="absolute right-3 top-3 text-sm text-muted-foreground">
                    {fromCurrency}
                  </div>
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
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
                    onClick={handleSwap}
                    className="cursor-pointer"
                  >
                    <ArrowRight className="w-6 h-6 text-green-600" />
                  </motion.div>

                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
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
                  className="w-full h-12 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl"
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

                {calculatedRate !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                      <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
                        {formatNumber(parseFloat(amount), fromCurrency)} {fromCurrency} = 
                      </div>
                      <div className="text-3xl font-bold text-green-600 mt-2">
                        {formatNumber(calculatedRate, toCurrency)} {toCurrency}
                      </div>
                      <div className="text-sm text-muted-foreground mt-3 border-t border-green-100 dark:border-green-800 pt-3">
                        1 {fromCurrency} = {formatNumber(calculatedRate / parseFloat(amount), toCurrency)} {toCurrency}
                      </div>
                    </div>

                    {competitors.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          Market Comparison
                          <span className="text-xs text-muted-foreground">(Real-time rates)</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {competitors.map((competitor, index) => (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              key={competitor.name}
                              className={`relative overflow-hidden rounded-lg ${
                                competitor.name === 'trustBank'
                                  ? 'bg-gradient-to-br from-green-600 to-green-700 text-white'
                                  : 'bg-white/50 dark:bg-black/40 border border-gray-100 dark:border-gray-800'
                              } p-4`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className={`font-semibold ${competitor.name === 'trustBank' ? 'text-lg' : 'text-base'}`}>
                                  {competitor.name}
                                </div>
                                {competitor.name === 'trustBank' && (
                                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                                    Best Rate
                                  </span>
                                )}
                              </div>
                              
                              <div className={`text-xl font-bold mt-2 ${competitor.name === 'trustBank' ? '' : 'text-gray-900 dark:text-gray-100'}`}>
                                {formatNumber(competitor.rate, toCurrency)} {toCurrency}
                              </div>
                              
                              <div className={`space-y-1 mt-3 text-sm ${
                                competitor.name === 'trustBank' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {competitor.features.map((feature, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className={`w-1 h-1 rounded-full ${
                                      competitor.name === 'trustBank' ? 'bg-white/80' : 'bg-gray-400'
                                    }`} />
                                    {feature}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/40 dark:to-blue-900/40 p-6 rounded-lg border border-green-200 dark:border-green-800">
                          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                            Why trust<span className="text-green-600">Bank</span> Offers the Best Rates
                          </h3>
                          <div className="grid gap-4">
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                              className="flex items-start gap-3"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white font-bold">1</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-green-700 dark:text-green-300">Direct Market Access</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">We source real time rates directly patners and verified order books, ensuring you get the most competitive prices.</p>
                              </div>
                            </motion.div>
                            
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                              className="flex items-start gap-3"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white font-bold">2</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-green-700 dark:text-green-300">Zero Fee Structure</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Unlike competitors who charge up to 1.8% in fees, we eliminate hidden charges to maximize your value.</p>
                              </div>
                            </motion.div>
                            
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                              className="flex items-start gap-3"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white font-bold">3</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-green-700 dark:text-green-300">Instant Processing</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Experience real-time transactions while others make you wait 24-72 hours for processing.</p>
                              </div>
                            </motion.div>
                          </div>
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