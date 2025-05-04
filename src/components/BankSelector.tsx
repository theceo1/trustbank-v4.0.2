import { useState } from 'react';
import { SUPPORTED_BANKS } from '@/lib/constants/banks';

interface Bank {
  code: string;
  name: string;
}

interface BankSelectorProps {
  onBankSelect: (bank: Bank) => void;
  selectedBank?: Bank;
}

export default function BankSelector({ onBankSelect, selectedBank }: BankSelectorProps) {
  const [banks] = useState<Bank[]>(SUPPORTED_BANKS);

  return (
    <div className="w-full">
      <label htmlFor="bank" className="block text-sm font-medium text-gray-700">
        Select Bank
      </label>
      <select
        id="bank"
        name="bank"
        value={selectedBank?.code || ''}
        onChange={(e) => {
          const selected = banks.find(bank => bank.code === e.target.value);
          if (selected) {
            onBankSelect(selected);
          }
        }}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">Select a bank</option>
        {banks.map((bank) => (
          <option key={bank.code} value={bank.code}>
            {bank.name}
          </option>
        ))}
      </select>
    </div>
  );
} 