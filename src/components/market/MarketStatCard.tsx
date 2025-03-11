import { ReactNode } from 'react';

interface MarketStatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  colorScheme: 'orange' | 'blue' | 'green';
  lastUpdated: string;
}

const colorSchemes = {
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-100 dark:border-orange-800',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-800',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-100 dark:border-green-800',
  },
};

export function MarketStatCard({ title, value, icon, colorScheme, lastUpdated }: MarketStatCardProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-6`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${colors.bg} ${colors.text}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
    </div>
  );
} 