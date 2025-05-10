'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PlatformWallet {
  id: string;
  currency: string;
  balance: string;
  locked: string;
  address?: string;
  tag?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  last_transaction_at?: string;
  type: 'hot' | 'cold';  // Added to distinguish between hot and cold wallets
}

interface WalletStats {
  totalBalance: number;
  hotWalletsBalance: number;
  coldWalletsBalance: number;
  currencyDistribution: Record<string, {
    total: number;
    hot: number;
    cold: number;
  }>;
}

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#eab308', '#6366f1', '#ec4899'];

interface TransferDialogProps {
  wallet: PlatformWallet;
  onTransfer: (data: { currency: string; amount: number; fromType: string; toType: string; note?: string }) => Promise<void>;
}

function TransferDialog({ wallet, onTransfer }: TransferDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const parsedAmount = parseFloat(amount);
      // Add minimum/maximum checks
      if (parsedAmount < 0.0001) {
        throw new Error('Minimum transfer amount is 0.0001');
      }
      const maxAmount = parseFloat(wallet.balance);
      if (parsedAmount > maxAmount) {
        throw new Error(`Maximum transfer amount is ${formatNumber(maxAmount)} ${wallet.currency.toUpperCase()}`);
      }

      await onTransfer({
        currency: wallet.currency,
        amount: parsedAmount,
        fromType: wallet.type,
        toType: wallet.type === 'hot' ? 'cold' : 'hot',
        note
      });
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="hover:bg-green-600 hover:text-white transition-colors"
        >
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-2">
        <DialogHeader>
          <DialogTitle>Transfer {wallet.currency.toUpperCase()}</DialogTitle>
          <DialogDescription>
            Move funds between hot and cold wallets
          </DialogDescription>
        </DialogHeader>
        {showConfirm ? (
          <div className="space-y-4">
            <p>Are you sure you want to transfer {formatNumber(parseFloat(amount))} {wallet.currency.toUpperCase()}?</p>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="hover:bg-red-600 hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Processing...' : 'Confirm Transfer'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.0001"
                min="0.0001"
                max={wallet.balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Available: ${formatNumber(parseFloat(wallet.balance))}`}
                required
                className="bg-white dark:bg-gray-950 border-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min: 0.0001 | Max: {formatNumber(parseFloat(wallet.balance))}
              </p>
            </div>
            <div>
              <Label>Note (Optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for this transfer"
                className="bg-white dark:bg-gray-950 border-2"
              />
            </div>
            <DialogFooter>
              <Button 
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Review Transfer
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<PlatformWallet[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currency, setCurrency] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      console.log('[WALLETS PAGE] Fetching platform wallets');

      const response = await fetch('/api/admin/wallets');
      if (!response.ok) {
        throw new Error('Failed to fetch wallets');
      }

      const data = await response.json();
      console.log('[WALLETS PAGE] Platform wallets:', data);

      // Transform the data to include wallet type
      const transformedWallets = data.wallets.map((wallet: PlatformWallet) => ({
        ...wallet,
        type: determineWalletType(wallet)
      }));

      setWallets(transformedWallets);
      calculateStats(transformedWallets);
    } catch (error) {
      console.error('[WALLETS PAGE] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch platform wallets. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const determineWalletType = (wallet: PlatformWallet): 'hot' | 'cold' => {
    // For now, all platform wallets are considered "hot" since cold storage
    // requires separate wallet addresses that need to be manually added
    return 'hot';
  };

  const calculateStats = (walletData: PlatformWallet[]) => {
    const stats: WalletStats = {
      totalBalance: 0,
      hotWalletsBalance: 0,
      coldWalletsBalance: 0,
      currencyDistribution: {}
    };

    walletData.forEach(wallet => {
      const balance = parseFloat(wallet.balance || '0');
      
      // Update total balances
      stats.totalBalance += balance;
      if (wallet.type === 'hot') {
        stats.hotWalletsBalance += balance;
      } else {
        stats.coldWalletsBalance += balance;
      }

      // Update currency distribution
      if (!stats.currencyDistribution[wallet.currency]) {
        stats.currencyDistribution[wallet.currency] = {
          total: 0,
          hot: 0,
          cold: 0
        };
      }

      stats.currencyDistribution[wallet.currency].total += balance;
      if (wallet.type === 'hot') {
        stats.currencyDistribution[wallet.currency].hot += balance;
      } else {
        stats.currencyDistribution[wallet.currency].cold += balance;
      }
    });

    setStats(stats);
  };

  const getDistributionData = (type: 'total' | 'hot' | 'cold' = 'total') => {
    if (!stats?.currencyDistribution) return [];
    
    return Object.entries(stats.currencyDistribution)
      .map(([currency, data]) => ({
        name: currency.toUpperCase(),
        value: type === 'total' ? data.total : 
               type === 'hot' ? data.hot : data.cold
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const filteredWallets = (type?: 'hot' | 'cold') => {
    return wallets.filter(wallet => {
      const matchesSearch = search
        ? wallet.currency.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesCurrency = currency !== 'all'
        ? wallet.currency.toLowerCase() === currency.toLowerCase()
        : true;
      const matchesType = type
        ? wallet.type === type
        : true;

      return matchesSearch && matchesCurrency && matchesType;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                formatCurrency(stats?.totalBalance || 0, 'USD')
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${Object.keys(stats?.currencyDistribution || {}).length} currencies`
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                formatCurrency(stats?.hotWalletsBalance || 0, 'USD')
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${filteredWallets('hot').length} active wallets`
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cold Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                formatCurrency(stats?.coldWalletsBalance || 0, 'USD')
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${filteredWallets('cold').length} reserve wallets`
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.name} (${formatCurrency(entry.value, 'USD')})`}
                  >
                    {getDistributionData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value, 'USD')}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 items-center mb-6">
        <Input
          placeholder="Search by currency..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-white dark:bg-gray-950 border-2"
        />
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-gray-950 border-2">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-950 border-2">
            <SelectItem value="all">All Currencies</SelectItem>
            {Object.keys(stats?.currencyDistribution || {}).map((curr) => (
              <SelectItem key={curr} value={curr.toLowerCase()}>
                {curr.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger 
            value="all"
            className={cn(
              "data-[state=active]:text-green-600",
              "data-[state=active]:border-b-2",
              "data-[state=active]:border-green-600"
            )}
          >
            All Wallets
          </TabsTrigger>
          <TabsTrigger 
            value="hot"
            className={cn(
              "data-[state=active]:text-green-600",
              "data-[state=active]:border-b-2",
              "data-[state=active]:border-green-600"
            )}
          >
            Hot Wallets
          </TabsTrigger>
          <TabsTrigger 
            value="cold"
            className={cn(
              "data-[state=active]:text-green-600",
              "data-[state=active]:border-b-2",
              "data-[state=active]:border-green-600"
            )}
          >
            Cold Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <WalletTable wallets={filteredWallets()} loading={loading} />
        </TabsContent>
        
        <TabsContent value="hot" className="mt-4">
          <WalletTable wallets={filteredWallets('hot')} loading={loading} />
        </TabsContent>
        
        <TabsContent value="cold" className="mt-4">
          <WalletTable wallets={filteredWallets('cold')} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WalletTable({ wallets, loading }: { wallets: PlatformWallet[], loading: boolean }) {
  const { toast } = useToast();
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);

  const handleTransfer = async (data: { currency: string; amount: number; fromType: string; toType: string; note?: string }) => {
    try {
      const response = await fetch('/api/admin/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Transfer failed');
      }

      const result = await response.json();
      
      toast({
        title: 'Transfer Successful',
        description: `Successfully transferred ${formatNumber(data.amount)} ${data.currency.toUpperCase()}`,
      });

      // Refresh the wallets data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Transfer Failed',
        description: error instanceof Error ? error.message : 'Failed to process transfer',
        variant: 'destructive',
      });
    }
  };

  const toggleExpand = (walletId: string) => {
    setExpandedWallet(expandedWallet === walletId ? null : walletId);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]"></TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Locked</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Transaction</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              </TableRow>
            ))
          ) : wallets.length > 0 ? (
            wallets.map((wallet) => (
              <React.Fragment key={wallet.id}>
                <TableRow className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                  <TableCell onClick={() => toggleExpand(wallet.id)}>
                    {expandedWallet === wallet.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{wallet.currency.toUpperCase()}</TableCell>
                  <TableCell>{formatNumber(parseFloat(wallet.balance))}</TableCell>
                  <TableCell>{formatNumber(parseFloat(wallet.locked))}</TableCell>
                  <TableCell>
                    <Badge variant={wallet.type === 'hot' ? 'default' : 'secondary'}>
                      {wallet.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={wallet.status === 'active' ? 'default' : 'destructive'}>
                      {wallet.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {wallet.last_transaction_at ? formatDate(wallet.last_transaction_at) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <TransferDialog wallet={wallet} onTransfer={handleTransfer} />
                  </TableCell>
                </TableRow>
                {expandedWallet === wallet.id && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-4 bg-gray-50 dark:bg-gray-900">
                      <AdminWalletTransactionHistory wallet={wallet} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4">
                No wallets found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function AdminWalletTransactionHistory({ wallet }: { wallet: PlatformWallet }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [wallet.id]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/admin/wallets/${wallet.id}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h3 className="font-medium mb-2">Recent Transactions</h3>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <div>
                <p className="font-medium">{tx.type}</p>
                <p className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-medium",
                  tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                )}>
                  {tx.type === 'credit' ? '+' : '-'}{formatNumber(tx.amount)} {wallet.currency.toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground">{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No recent transactions</p>
      )}
    </div>
  );
} 