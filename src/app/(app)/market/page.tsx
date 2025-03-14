'use server';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowRight, LineChart, Activity, Bitcoin } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { headers, cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { MarketClient } from './client';

// Move interfaces to a separate types file or keep them here
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

interface MarketData {
  pair: string;
  lastPrice: string;
  change24h: number;
  high24h: string;
  low24h: string;
  volume24h: string;
}

interface MarketOverview {
  totalMarketCap: string;
  tradingVolume24h: string;
  btcDominance: string;
  lastUpdated: string;
}

interface PriceData {
  pair: string;
  price: string;
  priceChangePercent: string;
  volume: string;
  lastUpdated: string;
}

export default async function MarketPage() {
  const supabase = createServerComponentClient({ 
    cookies
  })
  
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarketClient session={session} />
    </Suspense>
  );
} 