'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Wallet, MarketData } from '@/types/wallet';
import { useBalance } from './BalanceContext';
import { Icons } from '@/components/ui/icons';

interface AssetDistributionProps {
  wallets: Wallet[];
  marketData: MarketData[];
}

const COLORS = [
  '#10B981', // Green (for NGN)
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F43F5E', // Red
  '#6366F1', // Indigo
];

export function AssetDistribution({ wallets, marketData }: AssetDistributionProps) {
  const { isHidden } = useBalance();

  if (isHidden) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
        <Icons.eye className="h-8 w-8 mb-3 opacity-50" />
        <p className="text-sm">Balance visibility is currently hidden</p>
      </div>
    );
  }

  // Calculate asset values and prepare data for the pie chart
  const data = wallets
    .map(wallet => {
      const balance = parseFloat(wallet.balance || '0');
      const value = wallet.estimated_value || 0;

      // Only include if balance is greater than 0
      if (balance <= 0) return null;

      return {
        name: wallet.currency.toUpperCase(),
        value: value,
        balance: balance,
        price: wallet.market_price || 0,
        percentage: 0 // Will be calculated after filtering
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.value - a.value); // Sort by value descending

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // Calculate percentages
  data.forEach(item => {
    item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
  });

  // If no assets have value, show empty state
  if (totalValue === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
        <Icons.wallet className="h-8 w-8 mb-3 opacity-50" />
        <p className="text-sm">No assets to display</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => {
              const item = data.find(d => d.name === name);
              if (!item) return [value, name];
              return [
                <>
                  <div>Value: ₦{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div>Balance: {item.balance.toLocaleString(undefined, { minimumFractionDigits: item.name === 'BTC' ? 8 : 2, maximumFractionDigits: item.name === 'BTC' ? 8 : 2 })} {item.name}</div>
                  {item.name !== 'NGN' && (
                    <div>Price: ₦{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  )}
                </>,
                name
              ];
            }}
          />
          <Legend
            formatter={(value: string, entry: any) => {
              const dataEntry = data.find(d => d.name === value);
              if (!dataEntry) return value;
              const percentage = ((dataEntry.value / totalValue) * 100).toFixed(1);
              return `${value} (${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 