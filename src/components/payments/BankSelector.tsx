import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Bank {
  code: string;
  name: string;
  slug?: string;
}

interface BankSelectorProps {
  value: string;
  onSelect: (bankCode: string) => void;
}

export function BankSelector({ value, onSelect }: BankSelectorProps) {
  const { theme } = useTheme();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/payments/korapay/banks')
      .then(res => res.json())
      .then(data => {
        setBanks(data.data || []);
        setError(null);
      })
      .catch(() => setError('Failed to fetch banks'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Loading banks...</span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onSelect}>
      <SelectTrigger className={`h-8 text-xs rounded-md border-green-800/50 ${theme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-black'}`}>
        <SelectValue placeholder={loading ? 'Loading banks...' : 'Select your bank'} />
      </SelectTrigger>
      <SelectContent className={`${theme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-black'} border-green-800/50`}>
        {error ? (
          <div className="text-xs text-red-500 px-2 py-1">{error}</div>
        ) : (
          banks.map(bank => (
            <SelectItem key={bank.code} value={bank.code} className="text-xs">
              {bank.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
} 