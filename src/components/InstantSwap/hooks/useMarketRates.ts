import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/hooks/use-toast';

interface UseMarketRatesProps {
  fromCurrency: string;
  toCurrency: string;
}

interface MarketTicker {
  name: string;
  base_unit: string;
  quote_unit: string;
  low: string;
  high: string;
  last: string;
  open: string;
  volume: string;
  sell: string;
  buy: string;
  at: number;
  avg_price: string;
}

type MarketPairDirect = {
  pair: string;
  inverse: boolean;
  throughUsdt?: never;
};

type MarketPairUsdt = {
  pair1: string;
  pair2: string;
  throughUsdt: true;
};

type MarketPairInfo = MarketPairDirect | MarketPairUsdt | null;

export const useMarketRates = ({ fromCurrency, toCurrency }: UseMarketRatesProps) => {
  const [rate, setRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const fetchRate = useCallback(async () => {
    if (!fromCurrency || !toCurrency) return;

    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/markets/rate?from=${fromCurrency.toUpperCase()}&to=${toCurrency.toUpperCase()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (typeof data.rate !== 'number') {
        throw new Error('Invalid rate data received');
      }

      setRate(data.rate);
    } catch (error) {
      console.error('Error fetching market rate:', error);
      toast({
        title: "Error",
        description: "Failed to fetch market rate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fromCurrency, toCurrency, supabase, toast]);

  useEffect(() => {
    fetchRate();
    // Set up polling every 15 seconds
    const interval = setInterval(fetchRate, 15000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  return {
    rate,
    isLoading,
    refreshRate: fetchRate
  };
}; 