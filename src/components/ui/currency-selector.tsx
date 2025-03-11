import { Icons } from './icons';

interface Currency {
  id: string;
  label: string;
}

interface CurrencySelectorProps {
  selected: string;
  onSelect: (currency: string) => void;
  currencies: Currency[];
}

export function CurrencySelector({ selected, onSelect, currencies }: CurrencySelectorProps) {
  const getCurrencyIcon = (id: string) => {
    switch (id) {
      case 'BTC':
        return <Icons.bitcoin className="h-5 w-5 text-orange-500" />;
      case 'ETH':
        return <Icons.ethereum className="h-5 w-5 text-purple-500" />;
      case 'USDT':
      case 'USDC':
        return <Icons.dollar className="h-5 w-5 text-green-500" />;
      default:
        return <Icons.wallet className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-2">
      {currencies.map((currency) => (
        <button
          key={currency.id}
          onClick={() => onSelect(currency.id)}
          className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
            selected === currency.id
              ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
              : 'border-gray-200 hover:border-purple-200 dark:border-gray-800 dark:hover:border-purple-800'
          }`}
        >
          {getCurrencyIcon(currency.id)}
          <span className="flex-1 text-left font-medium">{currency.label}</span>
          {selected === currency.id && (
            <Icons.check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          )}
        </button>
      ))}
    </div>
  );
} 