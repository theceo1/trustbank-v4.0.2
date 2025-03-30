import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AmountCurrencyType } from "../types";

interface AmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  amountCurrency: AmountCurrencyType;
  onAmountCurrencyChange: (value: AmountCurrencyType) => void;
  fromCurrency: string;
  placeholder?: string;
}

export function AmountInput({
  amount,
  onAmountChange,
  amountCurrency,
  onAmountCurrencyChange,
  fromCurrency,
  placeholder,
}: AmountInputProps) {
  return (
    <div className="space-y-2">
      <Label>Amount</Label>
      <div className="relative">
        <Input
          type="number"
          step="any"
          min="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="pr-24 h-12 bg-white dark:bg-gray-800"
          placeholder={placeholder || `Enter amount in ${amountCurrency === 'CRYPTO' ? fromCurrency : amountCurrency}`}
        />
        <Select
          value={amountCurrency}
          onValueChange={(value) => onAmountCurrencyChange(value as AmountCurrencyType)}
        >
          <SelectTrigger className="absolute right-0 top-0 h-full w-24 border-l bg-white dark:bg-gray-800">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800">
            {fromCurrency && (
              <SelectItem 
                value="CRYPTO"
                className="hover:bg-green-600 hover:text-white transition-colors"
              >
                {fromCurrency}
              </SelectItem>
            )}
            <SelectItem 
              value="NGN"
              className="hover:bg-green-600 hover:text-white transition-colors"
            >
              NGN
            </SelectItem>
            <SelectItem 
              value="USD"
              className="hover:bg-green-600 hover:text-white transition-colors"
            >
              USD
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 