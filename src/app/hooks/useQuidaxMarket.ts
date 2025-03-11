import { useState, useEffect } from 'react';
import { MarketTicker } from '@/app/types/market';
import { getMarketTickers } from '@/lib/quidax';

interface UseMarketResult {
  data: MarketTicker | null;
  loading: boolean;
  error: Error | null;
}

export function useMarket(pair: string): UseMarketResult {
  const [data, setData] = useState<MarketTicker | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchMarketData() {
      try {
        setLoading(true);
        setError(null);
        const response = await getMarketTickers();
        const tickers = response.data || {};
        
        if (mounted && tickers[pair]) {
          setData(tickers[pair]);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching market data:', err);
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pair]);

  return { data, loading, error };
} 