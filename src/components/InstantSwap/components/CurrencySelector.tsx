import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrencyName } from "../utils/currency";
import { Currency } from "../types";

interface CurrencySelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  currencies: Currency[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  excludeCurrency?: string;
  showSearch?: boolean;
}

export function CurrencySelector({
  label,
  value,
  onChange,
  currencies,
  searchQuery,
  onSearchChange,
  excludeCurrency,
  showSearch = true,
}: CurrencySelectorProps) {
  const filteredCurrencies = currencies.filter(currency => 
    currency.value.toLowerCase() !== excludeCurrency?.toLowerCase() &&
    (currency.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
     currency.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800 border shadow-sm">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-800 max-h-[200px] overflow-hidden">
          {showSearch && (
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2 border-b">
              <Input
                type="text"
                placeholder="Search currencies..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9"
              />
            </div>
          )}
          <div className="overflow-y-auto max-h-[160px]">
            {filteredCurrencies.map((currency) => (
              <SelectItem 
                key={currency.value} 
                value={currency.value}
                className="hover:bg-green-600 hover:text-white transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{currency.value}</span>
                  <span className="text-muted-foreground">
                    {getCurrencyName(currency.value)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
} 