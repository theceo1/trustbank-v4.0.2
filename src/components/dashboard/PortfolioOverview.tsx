import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { quidaxService } from '@/lib/quidax';
import type { MarketTicker } from '@/app/types/market';

interface WalletBalance {
  currency: string;
  balance: string;
}

interface MarketPrice {
  currency: string;
  price: number;
  change_24h: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function PortfolioOverview({ wallets }: { wallets: WalletBalance[] }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const tickers = await quidaxService.getMarketTickers();
        const prices = Object.entries(tickers).map(([currency, data]) => ({
          currency,
          price: parseFloat(data.ticker.last),
          change_24h: parseFloat(data.ticker.last) - parseFloat(data.ticker.open),
        }));
        setMarketPrices(prices);

        // Calculate total portfolio value
        const total = wallets.reduce((acc, wallet) => {
          const price = prices.find(p => p.currency === wallet.currency)?.price || 1;
          return acc + parseFloat(wallet.balance) * price;
        }, 0);

        setTotalValue(total);
      } catch (err: any) {
        console.error('Error loading market prices:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketPrices();
  }, [wallets]);

  const pieData = wallets.map((wallet, index) => ({
    name: wallet.currency,
    value: parseFloat(wallet.balance) * (marketPrices.find(p => p.currency === wallet.currency)?.price || 1),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Total Portfolio Value
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(totalValue, 'USD')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Asset Distribution */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Asset Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.name}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, 'USD')}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Prices */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Market Prices</h3>
          <div className="space-y-4">
            {marketPrices.map((price) => (
              <div
                key={price.currency}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{price.currency}/USD</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(price.price, 'USD')}
                  </p>
                  <p
                    className={
                      price.change_24h >= 0
                        ? 'text-sm text-green-500'
                        : 'text-sm text-red-500'
                    }
                  >
                    {price.change_24h >= 0 ? '+' : ''}
                    {price.change_24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 