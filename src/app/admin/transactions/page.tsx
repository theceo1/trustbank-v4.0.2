'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import type { DateRange as DayPickerDateRange } from 'react-day-picker';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    description: string;
    reference: string;
    destination: string;
    source: string;
    notes?: string;
    // Extended for provider-specific fields
    provider?: string;
    korapay?: any;
    korapay_event?: any;
    [key: string]: any;
  };

}

interface TransactionStats {
  totalVolume: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  volumeChange: number;
  successRateChange: number;
  failureRateChange: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface TransactionFilters {
  type: string;
  status: string;
  search: string;
  dateRange?: DateRange;
}

const defaultStats = {
  totalVolume: 0,
  successfulTransactions: 0,
  failedTransactions: 0,
  pendingTransactions: 0,
  volumeChange: 0,
  successRateChange: 0,
  failureRateChange: 0
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    status: 'all',
    search: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    console.log('[TRANSACTIONS PAGE] Starting to fetch transactions');
    try {
      setLoading(true);
      setError(null);
      
      console.log('[TRANSACTIONS PAGE] Making API request');
      const response = await fetch('/api/admin/transactions');
      console.log('[TRANSACTIONS PAGE] API response status:', response.status);
      
      const data = await response.json();
      console.log('[TRANSACTIONS PAGE] API response data:', {
        status: data.status,
        error: data.error,
        transactionCount: data.transactions?.length,
        stats: data.stats
      });

      if (!response.ok) {
        console.error('[TRANSACTIONS PAGE] API error:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details
        });
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      console.log('[TRANSACTIONS PAGE] Setting state with fetched data');
      setTransactions(data.transactions || []);
      setStats(data.stats || defaultStats);
      
    } catch (error) {
      console.error('[TRANSACTIONS PAGE] Error in fetchTransactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch transactions');
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch transactions'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Button onClick={fetchTransactions} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Volume
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-[120px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.totalVolume || 0, 'USD')}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  {stats?.volumeChange}% from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Successful Transactions
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-[80px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.successfulTransactions || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  {stats?.successRateChange}% from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Transactions
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-[80px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.failedTransactions || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  {stats?.failureRateChange}% from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Transactions
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-[80px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.pendingTransactions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting confirmation
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="swap">Swaps</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DateRangePicker
              value={filters.dateRange}
              onChange={(range: DayPickerDateRange | undefined) => {
                if (range?.from && range?.to) {
                  const dateRange: DateRange = {
                    from: range.from,
                    to: range.to
                  };
                  setFilters(prev => ({
                    ...prev,
                    dateRange
                  }));
                } else {
                  setFilters(prev => ({
                    ...prev,
                    dateRange: undefined
                  }));
                }
              }}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[20px]" /></TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No transactions found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">
                        {transaction.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{transaction.userName}</span>
                          <span className="text-xs text-muted-foreground">{transaction.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{transaction.type}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                        {transaction.metadata.notes && (
                          <div className="text-xs text-muted-foreground">
                            {transaction.metadata.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(transaction.status)}
                          className="flex w-fit items-center gap-1"
                        >
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(transaction.createdAt)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      {/* Provider column */}
                      <TableCell>
                        {transaction.metadata?.provider
                          ? transaction.metadata.provider === 'korapay'
                            ? <span className="text-blue-600 font-semibold">KoraPay</span>
                            : <span className="text-yellow-600 font-semibold">Quidax</span>
                          : <span className="text-muted-foreground">N/A</span>
                        }
                      </TableCell>
                      {/* Details column */}
                      <TableCell>
                        {transaction.metadata?.provider === 'korapay' ? (
                          <div className="text-xs space-y-1">
                            {transaction.metadata?.korapay?.data?.virtual_bank_account_details?.virtual_bank_account?.bank_name && (
                              <div>Bank: {transaction.metadata.korapay.data.virtual_bank_account_details.virtual_bank_account.bank_name}</div>
                            )}
                            {transaction.metadata?.korapay?.data?.virtual_bank_account_details?.virtual_bank_account?.account_number && (
                              <div>Acct: {transaction.metadata.korapay.data.virtual_bank_account_details.virtual_bank_account.account_number}</div>
                            )}
                            {transaction.metadata?.korapay?.data?.narration && (
                              <div>Narration: {transaction.metadata.korapay.data.narration}</div>
                            )}
                            {transaction.metadata?.korapay_event?.event && (
                              <div>Webhook: {transaction.metadata.korapay_event.event}</div>
                            )}
                            <div>Status: {transaction.status}</div>
                          </div>
                        ) : transaction.metadata?.provider === 'quidax' ? (
                          <div className="text-xs text-yellow-700">Quidax transaction</div>
                        ) : (
                          <div className="text-xs text-muted-foreground">—</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 