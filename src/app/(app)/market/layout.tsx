import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Market Overview | trustBank - CRYPTO | SIMPLIFIED',
  description: 'Real-time cryptocurrency market data and trading information',
};

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
} 