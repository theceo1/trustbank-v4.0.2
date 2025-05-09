//src/components/admin/transactions/TransactionDetails.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

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
    source?: string;
    notes?: string;
    trustbank_fee?: number | string;
    korapay_fee?: number | string;
    [key: string]: any;
  };
  history?: {
    timestamp: string;
    action: string;
    actor: string;
    notes?: string;
  }[];
}

interface TransactionDetailsProps {
  transactionId: string;
}

export function TransactionDetails({ transactionId }: TransactionDetailsProps) {
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/transactions/${transactionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }
      const data = await response.json();
      setTransaction(data.transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to load transaction details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/admin/transactions/${transactionId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: actionReason
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} transaction`);
      }

      toast({
        title: "Success",
        description: `Transaction ${action}ed successfully`,
      });

      // Refresh transaction data
      fetchTransaction();
      setShowRejectDialog(false);
      setActionReason('');
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to ${action} transaction`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium text-red-500">{error}</p>
        <Button onClick={fetchTransaction}>Retry</Button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <p className="text-lg font-medium">Transaction not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transactions
        </Button>
        <Badge
          variant={getStatusBadgeVariant(transaction.status)}
          className="flex items-center gap-1"
        >
          {getStatusIcon(transaction.status)}
          {transaction.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reference</p>
              <p className="font-mono">{transaction.metadata.reference}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-xl font-bold">
                {formatCurrency(transaction.amount, transaction.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p className="capitalize">{transaction.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p>{formatDate(transaction.createdAt)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">User Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p>{transaction.userName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{transaction.userEmail}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">Additional Information</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p>{transaction.metadata.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">trustBank Fee</p>
                <p>{transaction.metadata?.trustbank_fee != null ? `₦${formatCurrency(Number(transaction.metadata.trustbank_fee), 'NGN')}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Korapay Fee</p>
                <p>{transaction.metadata?.korapay_fee != null ? `₦${formatCurrency(Number(transaction.metadata.korapay_fee), 'NGN')}` : '-'}</p>
              </div>
              {transaction.metadata.source && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Source</p>
                  <p>{transaction.metadata.source}</p>
                </div>
              )}
              {transaction.metadata.destination && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Destination</p>
                  <p>{transaction.metadata.destination}</p>
                </div>
              )}
              {transaction.metadata.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p>{transaction.metadata.notes}</p>
                </div>
              )}
            </div>
          </div>

          {transaction.history && transaction.history.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-2">Transaction History</h3>
                <div className="space-y-4">
                  {transaction.history.map((event, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-32 shrink-0 text-sm text-muted-foreground">
                        {formatDate(event.timestamp)}
                      </div>
                      <div>
                        <p className="font-medium">{event.action}</p>
                        <p className="text-sm text-muted-foreground">by {event.actor}</p>
                        {event.notes && (
                          <p className="text-sm mt-1">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {transaction.status === 'pending' && (
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleAction('approve')}
                disabled={isSubmitting}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            className="mt-4"
            placeholder="Enter reason for rejection (required)"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            required
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction('reject')}
              disabled={isSubmitting || !actionReason.trim()}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}