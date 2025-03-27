import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const SUPPORTED_CURRENCIES = [
  'USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'MATIC', 'DOGE', 'XRP', 'ADA', 'DOT'
];

export function WalletActions() {
  const [loading, setLoading] = useState(false);
  const [fromCurrency, setFromCurrency] = useState('USDT');
  const [toCurrency, setToCurrency] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [network, setNetwork] = useState('');

  const handleTransfer = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/wallets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: fromCurrency,
          amount,
          address: recipientAddress,
          network,
        }),
      });

      if (!response.ok) throw new Error('Transfer failed');
      
      toast.success('Transfer initiated successfully');
      setAmount('');
      setRecipientAddress('');
      setNetwork('');
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Failed to initiate transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/wallets/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency,
          toCurrency,
          amount,
        }),
      });

      if (!response.ok) throw new Error('Swap failed');
      
      toast.success('Swap initiated successfully');
      setAmount('');
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Failed to initiate swap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>Transfer funds or swap between cryptocurrencies</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Transfer Amount</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={fromCurrency}
                onValueChange={setFromCurrency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Recipient Address</Label>
            <Input
              placeholder="Enter recipient address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Network</Label>
            <Input
              placeholder="e.g., BEP20, ERC20, TRC20"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
            />
          </div>
          <Button onClick={handleTransfer} disabled={loading}>
            {loading ? 'Processing...' : 'Transfer'}
          </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Swap Currencies</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={fromCurrency}
                onValueChange={setFromCurrency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="From currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={toCurrency}
                onValueChange={setToCurrency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="To currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Amount to Swap</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleSwap} disabled={loading}>
            {loading ? 'Processing...' : 'Swap'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}