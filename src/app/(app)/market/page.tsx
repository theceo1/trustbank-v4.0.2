import { Suspense } from 'react';
import { MarketClient } from './client';

export const metadata = {
  title: 'Market Overview | TrustBank',
  description: 'Real-time cryptocurrency market data and trading information',
};

export default async function MarketPage() {
  return (
    <Suspense fallback={<div>Loading market data...</div>}>
      <MarketClient session={null} />
    </Suspense>
  );
} 