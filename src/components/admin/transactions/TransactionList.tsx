import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { TransactionFilters } from './TransactionFilters';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

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
    trustbank_fee?: number | string;
    korapay_fee?: number | string;
    [key: string]: any;
  };
}

interface TransactionFiltersState {
  type: string;
  status: string;
  search: string;
  dateRange?: DateRange;
}

export function TransactionList() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFiltersState>({
    type: 'all',
    status: 'all',
    search: '',
    dateRange: undefined
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (filters.type !== 'all') searchParams.append('type', filters.type);
      if (filters.status !== 'all') searchParams.append('status', filters.status);
      if (filters.search) searchParams.append('search', filters.search);
      if (filters.dateRange?.from) searchParams.append('from', filters.dateRange.from.toISOString());
      if (filters.dateRange?.to) searchParams.append('to', filters.dateRange.to.toISOString());

      const response = await fetch(`/api/admin/transactions?${searchParams}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<TransactionFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRowClick = (transactionId: string) => {
    router.push(`/admin/transactions/${transactionId}`);
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleAction = async (transactionId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/transactions/${transactionId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast({
        title: "Success",
        description: `Transaction ${action}d successfully`,
      });

      fetchTransactions();
    } catch (error) {
      console.error('Error performing transaction action:', error);
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchTransactions} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>trustBank Fee</TableHead>
              <TableHead>Korapay Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(transaction.id)}
                >
                  <TableCell className="font-medium">
                    {transaction.metadata.reference}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.userEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{transaction.type}</TableCell>
                  <TableCell>
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </TableCell>
                  <TableCell>
                    {transaction.metadata?.trustbank_fee != null ? (
                      <span>₦{formatCurrency(Number(transaction.metadata.trustbank_fee), 'NGN')}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {transaction.metadata?.korapay_fee != null ? (
                      <span>₦{formatCurrency(Number(transaction.metadata.korapay_fee), 'NGN')}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedTransaction(transaction)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {transaction.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleAction(transaction.id, 'approve')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(transaction.id, 'reject')}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 