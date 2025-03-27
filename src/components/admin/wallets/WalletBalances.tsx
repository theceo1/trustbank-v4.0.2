import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';

interface WalletBalance {
  currency: string;
  balance: string;
  usdValue: number;
  address: string;
  network?: string;
}

export function WalletBalances() {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBalances() {
      try {
        const response = await fetch('/api/admin/wallets/balances');
        const data = await response.json();
        setBalances(data);
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBalances();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balances</CardTitle>
          <CardDescription>Current balances across all supported cryptocurrencies</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Balances</CardTitle>
        <CardDescription>Current balances across all supported cryptocurrencies</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>USD Value</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map((balance) => (
              <TableRow key={balance.currency}>
                <TableCell className="font-medium">{balance.currency.toUpperCase()}</TableCell>
                <TableCell>{balance.balance}</TableCell>
                <TableCell>{formatCurrency(balance.usdValue, 'USD')}</TableCell>
                <TableCell className="font-mono text-sm">
                  {balance.address.slice(0, 8)}...{balance.address.slice(-8)}
                </TableCell>
                <TableCell>{balance.network || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(balance.address)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a
                        href={`https://www.blockchain.com/explorer/addresses/${balance.currency.toLowerCase()}/${balance.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 