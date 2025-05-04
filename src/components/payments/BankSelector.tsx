import { useTheme } from 'next-themes';
import { useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { SUPPORTED_BANKS } from '@/lib/constants/banks';

interface Bank {
  code: string;
  name: string;
}

interface BankSelectorProps {
  value: string;
  onSelect: (bankCode: string) => void;
}

export function BankSelector({ value, onSelect }: BankSelectorProps) {
  const { theme } = useTheme();
  const [banks] = useState<Bank[]>(SUPPORTED_BANKS);

  return (
    <Select value={value} onValueChange={onSelect}>
      <SelectTrigger className={`h-8 text-xs rounded-md border-green-800/50 ${theme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-black'}`}>
        <SelectValue placeholder="Select your bank" />
      </SelectTrigger>
      <SelectContent className={`${theme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-black'} border-green-800/50`}>
        {banks.length === 0 ? (
          <div className="text-xs text-gray-500 px-2 py-1">No banks available</div>
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